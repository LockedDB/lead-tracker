'use client'
import { Fragment, memo, useMemo, useState } from 'react'
import { Search, Star, GripVertical } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { StatusDef } from '@/lib/client/status'
import { StatusBadge } from './StatusBadge'
import { StatusSelect } from './StatusSelect'
import { NextActionCell } from './NextActionCell'

export type EntityRow = {
  id: number
  company: string
  secondary: string | null // role (jobs) o vertical (leads)
  status: string
  starred: boolean
  next_action: string | null
  next_action_note: string | null
}

const headClass = 'text-muted-foreground text-xs font-medium uppercase tracking-wide'
const COL_COUNT = 4

type RowContentProps = {
  r: EntityRow
  statusDefs: StatusDef[]
  onChangeStatus: (id: number, value: string) => void
  onToggleStar: (id: number, value: boolean) => void
}

type RowProps = RowContentProps & { onSelect: (id: number) => void }

function sameRowData(a: EntityRow, b: EntityRow): boolean {
  return (
    a.id === b.id &&
    a.company === b.company &&
    a.secondary === b.secondary &&
    a.status === b.status &&
    a.starred === b.starred &&
    a.next_action === b.next_action &&
    a.next_action_note === b.next_action_note
  )
}

function rowContentEqual(a: RowContentProps, b: RowContentProps): boolean {
  return (
    sameRowData(a.r, b.r) &&
    a.statusDefs === b.statusDefs &&
    a.onChangeStatus === b.onChangeStatus &&
    a.onToggleStar === b.onToggleStar
  )
}

// El contenido pesado de la fila (Select de estado de radix, tooltip de la estrella) se
// memoiza: cuando la fila se re-renderiza solo por el transform del drag o por el
// contexto de dnd-kit, este subárbol se salta. Es lo que evita repintar 50 filas al
// reordenar. Depende de que los callbacks lleguen estables desde la página.
const RowContent = memo(function RowContent({
  r,
  statusDefs,
  onChangeStatus,
  onToggleStar,
}: RowContentProps) {
  return (
    <>
      <TableCell className="font-medium">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleStar(r.id, !r.starred)
              }}
              aria-label={r.starred ? 'Quitar estrella' : 'Marcar con estrella'}
              className={cn(
                'mr-1 align-middle',
                r.starred ? 'text-primary hover:text-primary' : 'text-muted-foreground/40',
              )}
            >
              <Star className={cn('size-4', r.starred && 'fill-current')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{r.starred ? 'Quitar estrella' : 'Destacar'}</TooltipContent>
        </Tooltip>
        {r.company}
        {r.secondary && (
          <span className="text-muted-foreground ml-2 text-xs font-normal">{r.secondary}</span>
        )}
      </TableCell>
      <TableCell>
        <StatusSelect
          defs={statusDefs}
          value={r.status}
          onChange={(v) => onChangeStatus(r.id, v)}
        />
      </TableCell>
      <TableCell>
        <NextActionCell date={r.next_action} note={r.next_action_note} />
      </TableCell>
    </>
  )
}, rowContentEqual)

const SortableRow = memo(function SortableRow({
  r,
  statusDefs,
  onSelect,
  onChangeStatus,
  onToggleStar,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: r.id,
  })
  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => onSelect(r.id)}
      className={cn('cursor-pointer', isDragging && 'relative z-10 opacity-80')}
    >
      <TableCell className="w-8 px-1">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Arrastrar para reordenar"
          className="text-muted-foreground/30 hover:text-muted-foreground flex cursor-grab touch-none items-center active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      <RowContent
        r={r}
        statusDefs={statusDefs}
        onChangeStatus={onChangeStatus}
        onToggleStar={onToggleStar}
      />
    </TableRow>
  )
})

function StaticRow({ r, onSelect, ...content }: RowProps) {
  return (
    <TableRow onClick={() => onSelect(r.id)} className="cursor-pointer">
      <TableCell className="w-8 px-1">
        <span
          title="Borra la búsqueda para reordenar"
          className="text-muted-foreground/20 flex cursor-not-allowed items-center"
        >
          <GripVertical className="size-4" />
        </span>
      </TableCell>
      <RowContent r={r} {...content} />
    </TableRow>
  )
}

function GroupHeader({ defs, value, count }: { defs: StatusDef[]; value: string; count: number }) {
  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={COL_COUNT} className="bg-muted/40 py-1.5">
        <span className="inline-flex items-center gap-2">
          <StatusBadge defs={defs} value={value} />
          <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
        </span>
      </TableCell>
    </TableRow>
  )
}

export function EntityTable({
  rows,
  statusDefs,
  onSelect,
  onChangeStatus,
  onToggleStar,
  onReorder,
}: {
  rows: EntityRow[]
  statusDefs: StatusDef[]
  onSelect: (id: number) => void
  onChangeStatus: (id: number, value: string) => void
  onToggleStar: (id: number, value: boolean) => void
  onReorder: (ids: number[]) => void
}) {
  const [query, setQuery] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.company.toLowerCase().includes(q) ||
        (r.secondary?.toLowerCase().includes(q) ?? false),
    )
  }, [rows, query])

  // Agrupa por estado en el orden de statusDefs (embudo). Estados no definidos
  // (datos viejos) caen en grupos propios al final. El orden dentro de cada grupo
  // ya viene del SQL (sort_order).
  const groups = useMemo(() => {
    const known = new Set(statusDefs.map((d) => d.value))
    const result = statusDefs
      .map((d) => ({ value: d.value, rows: filtered.filter((r) => r.status === d.value) }))
      .filter((g) => g.rows.length > 0)
    const orphans = filtered.filter((r) => !known.has(r.status))
    for (const r of orphans) {
      const g = result.find((x) => x.value === r.status)
      if (g) g.rows.push(r)
      else result.push({ value: r.status, rows: [r] })
    }
    // `ids` precalculado: identidad estable mientras groups no se recompute, para no
    // forzar churn del contexto de SortableContext en re-renders ajenos.
    return result.map((g) => ({ ...g, ids: g.rows.map((r) => r.id) }))
  }, [statusDefs, filtered])

  const sortable = query.trim() === ''

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const activeId = Number(active.id)
    const overId = Number(over.id)
    const group = groups.find((g) => g.ids.includes(activeId))
    // Solo se reordena dentro del mismo estado; cruzar estados se hace con el selector.
    if (!group || !group.ids.includes(overId)) return
    const reordered = arrayMove(group.ids, group.ids.indexOf(activeId), group.ids.indexOf(overId))
    const fullOrder = groups.flatMap((g) => (g.value === group.value ? reordered : g.ids))
    onReorder(fullOrder)
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          className="pl-8"
        />
      </div>

      <div className="bg-card overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(headClass, 'w-8')} />
              <TableHead className={headClass}>Empresa</TableHead>
              <TableHead className={headClass}>Estado</TableHead>
              <TableHead className={headClass}>Próxima acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={COL_COUNT}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  Sin resultados para “{query}”.
                </TableCell>
              </TableRow>
            ) : sortable ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                {groups.map((g) => (
                  <Fragment key={g.value}>
                    <GroupHeader defs={statusDefs} value={g.value} count={g.rows.length} />
                    <SortableContext items={g.ids} strategy={verticalListSortingStrategy}>
                      {g.rows.map((r) => (
                        <SortableRow
                          key={r.id}
                          r={r}
                          statusDefs={statusDefs}
                          onSelect={onSelect}
                          onChangeStatus={onChangeStatus}
                          onToggleStar={onToggleStar}
                        />
                      ))}
                    </SortableContext>
                  </Fragment>
                ))}
              </DndContext>
            ) : (
              groups.map((g) => (
                <Fragment key={g.value}>
                  <GroupHeader defs={statusDefs} value={g.value} count={g.rows.length} />
                  {g.rows.map((r) => (
                    <StaticRow
                      key={r.id}
                      r={r}
                      statusDefs={statusDefs}
                      onSelect={onSelect}
                      onChangeStatus={onChangeStatus}
                      onToggleStar={onToggleStar}
                    />
                  ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
