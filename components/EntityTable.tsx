'use client'
import { useMemo, useState } from 'react'
import { Search, Star } from 'lucide-react'
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
import { StatusSelect } from './StatusSelect'
import { NextActionCell } from './NextActionCell'

export type EntityRow = {
  id: number
  company: string
  secondary: string | null // role (jobs) o vertical (leads)
  status: string
  priority: number
  starred: boolean
  next_action: string | null
  next_action_note: string | null
}

const headClass = 'text-muted-foreground text-xs font-medium uppercase tracking-wide'

export function EntityTable({
  rows,
  statusDefs,
  onSelect,
  onChangeStatus,
  onChangePriority,
  onToggleStar,
}: {
  rows: EntityRow[]
  statusDefs: StatusDef[]
  onSelect: (id: number) => void
  onChangeStatus: (id: number, value: string) => void
  onChangePriority: (id: number, value: number) => void
  onToggleStar: (id: number, value: boolean) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.company.toLowerCase().includes(q) ||
        (r.secondary?.toLowerCase().includes(q) ?? false),
    )
  }, [rows, query])

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
              <TableHead className={headClass}>Empresa</TableHead>
              <TableHead className={headClass}>Estado</TableHead>
              <TableHead className={headClass}>Prioridad</TableHead>
              <TableHead className={headClass}>Próxima acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center text-sm">
                  Sin resultados para “{query}”.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} onClick={() => onSelect(r.id)} className="cursor-pointer">
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
                      <span className="text-muted-foreground ml-2 text-xs font-normal">
                        {r.secondary}
                      </span>
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
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      key={r.priority}
                      defaultValue={r.priority}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      }}
                      onBlur={(e) => {
                        const n = Number(e.target.value)
                        if (n >= 1 && n <= 10 && n !== r.priority) onChangePriority(r.id, n)
                      }}
                      className="h-8 w-16 tabular-nums"
                    />
                  </TableCell>
                  <TableCell>
                    <NextActionCell date={r.next_action} note={r.next_action_note} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
