'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shell } from '@/components/Shell'
import { EntityTable, type EntityRow } from '@/components/EntityTable'
import { DetailModal } from '@/components/DetailModal'
import { TableSkeleton } from '@/components/TableSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { LEAD_STATUSES } from '@/lib/client/status'
import { LEAD_FIELDS } from '@/lib/client/fields'
import { isToday } from '@/lib/client/dates'
import { api, type Lead } from '@/lib/client/api'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  // Callbacks estables (deps vacías): así las filas memoizadas de la tabla no se
  // re-renderizan en cada cambio de estado del padre (p. ej. tras un reorder).
  const reload = useCallback(async () => {
    setLeads(await api.listLeads())
    setLoading(false)
  }, [])

  // Reordenado optimista: aplicamos el nuevo orden en local al instante (reutilizando
  // los mismos objetos Lead) y persistimos en segundo plano.
  const reorder = useCallback(
    (ids: number[]) => {
      setLeads((prev) => {
        const byId = new Map(prev.map((l) => [l.id, l]))
        return ids.map((id) => byId.get(id)).filter((l): l is Lead => Boolean(l))
      })
      api.reorderLeads(ids).catch(() => reload())
    },
    [reload],
  )

  const onChangeStatus = useCallback(
    (id: number, v: string) => api.updateLead(id, { pipeline_status: v }).then(reload),
    [reload],
  )
  const onToggleStar = useCallback(
    (id: number, v: boolean) => api.updateLead(id, { starred: v }).then(reload),
    [reload],
  )

  useEffect(() => {
    let active = true
    api.listLeads().then((data) => {
      if (!active) return
      setLeads(data)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const rows: EntityRow[] = useMemo(
    () =>
      leads.map((l) => ({
        id: l.id,
        company: l.company,
        secondary: l.vertical,
        status: l.pipeline_status,
        starred: l.starred,
        next_action: l.next_action,
        next_action_note: l.next_action_note,
      })),
    [leads],
  )
  const todayCount = leads.filter((l) => isToday(l.next_action)).length

  return (
    <Shell todayCount={todayCount} onNew={() => setCreating(true)}>
      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Aún no hay clientes"
          description="Empieza añadiendo tu primer cliente para hacerle seguimiento."
          actionLabel="Nuevo cliente"
          onAction={() => setCreating(true)}
        />
      ) : (
        <EntityTable
          rows={rows}
          statusDefs={LEAD_STATUSES}
          onSelect={setSelectedId}
          onChangeStatus={onChangeStatus}
          onToggleStar={onToggleStar}
          onReorder={reorder}
        />
      )}
      <DetailModal
        subjectType="lead"
        subjectId={selectedId}
        creating={creating}
        fields={LEAD_FIELDS}
        onClose={() => {
          setSelectedId(null)
          setCreating(false)
        }}
        onChanged={reload}
      />
    </Shell>
  )
}
