'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shell } from '@/components/Shell'
import { EntityTable, type EntityRow } from '@/components/EntityTable'
import { DetailModal } from '@/components/DetailModal'
import { TableSkeleton } from '@/components/TableSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { JOB_STATUSES } from '@/lib/client/status'
import { JOB_FIELDS } from '@/lib/client/fields'
import { isToday } from '@/lib/client/dates'
import { api, type Job } from '@/lib/client/api'

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  // Callbacks estables (deps vacías): así las filas memoizadas de la tabla no se
  // re-renderizan en cada cambio de estado del padre (p. ej. tras un reorder).
  const reload = useCallback(async () => {
    setJobs(await api.listJobs())
    setLoading(false)
  }, [])

  // Reordenado optimista: aplicamos el nuevo orden en local al instante (reutilizando
  // los mismos objetos Job) y persistimos en segundo plano.
  const reorder = useCallback(
    (ids: number[]) => {
      setJobs((prev) => {
        const byId = new Map(prev.map((j) => [j.id, j]))
        return ids.map((id) => byId.get(id)).filter((j): j is Job => Boolean(j))
      })
      api.reorderJobs(ids).catch(() => reload())
    },
    [reload],
  )

  const onChangeStatus = useCallback(
    (id: number, v: string) => api.updateJob(id, { status: v }).then(reload),
    [reload],
  )
  const onToggleStar = useCallback(
    (id: number, v: boolean) => api.updateJob(id, { starred: v }).then(reload),
    [reload],
  )

  useEffect(() => {
    let active = true
    api.listJobs().then((data) => {
      if (!active) return
      setJobs(data)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const rows: EntityRow[] = useMemo(
    () =>
      jobs.map((j) => ({
        id: j.id,
        company: j.company,
        secondary: j.role,
        status: j.status,
        starred: j.starred,
        next_action: j.next_action,
        next_action_note: j.next_action_note,
      })),
    [jobs],
  )
  const todayCount = jobs.filter((j) => isToday(j.next_action)).length

  return (
    <Shell todayCount={todayCount} onNew={() => setCreating(true)}>
      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Aún no hay curros"
          description="Añade una oferta para hacerle seguimiento y generar tu cover letter."
          actionLabel="Nuevo curro"
          onAction={() => setCreating(true)}
        />
      ) : (
        <EntityTable
          rows={rows}
          statusDefs={JOB_STATUSES}
          onSelect={setSelectedId}
          onChangeStatus={onChangeStatus}
          onToggleStar={onToggleStar}
          onReorder={reorder}
        />
      )}
      <DetailModal
        subjectType="job"
        subjectId={selectedId}
        creating={creating}
        fields={JOB_FIELDS}
        onClose={() => {
          setSelectedId(null)
          setCreating(false)
        }}
        onChanged={reload}
      />
    </Shell>
  )
}
