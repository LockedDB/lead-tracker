'use client'
import { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { EntityTable, type TableRow } from '@/components/EntityTable'
import { DetailModal } from '@/components/DetailModal'
import { JOB_STATUSES } from '@/lib/client/status'
import { JOB_FIELDS } from '@/lib/client/fields'
import { isToday } from '@/lib/client/dates'
import { api, type Job } from '@/lib/client/api'

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  async function load(showLoading = false) {
    if (showLoading) setLoading(true)
    try {
      setJobs(await api.listJobs())
    } finally {
      if (showLoading) setLoading(false)
    }
  }
  const reload = () => load()
  useEffect(() => {
    load(true)
  }, [])

  const rows: TableRow[] = jobs.map((j) => ({
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
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aún no hay curros. Crea uno con “+ Nuevo”.
        </p>
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
