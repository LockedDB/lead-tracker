'use client'
import { useEffect, useState } from 'react'
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

  async function load() {
    setJobs(await api.listJobs())
    setLoading(false)
  }
  const reload = () => load()
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

  const rows: EntityRow[] = jobs.map((j) => ({
    id: j.id,
    company: j.company,
    secondary: j.role,
    status: j.status,
    priority: j.priority,
    starred: j.starred,
    next_action: j.next_action,
    next_action_note: j.next_action_note,
  }))
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
          onChangeStatus={(id, v) => api.updateJob(id, { status: v }).then(reload)}
          onChangePriority={(id, v) => api.updateJob(id, { priority: v }).then(reload)}
          onToggleStar={(id, v) => api.updateJob(id, { starred: v }).then(reload)}
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
