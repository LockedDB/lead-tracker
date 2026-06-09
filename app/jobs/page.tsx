'use client'
import { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { EntityTable, type TableRow } from '@/components/EntityTable'
import { DetailDrawer } from '@/components/DetailDrawer'
import { JOB_STATUSES } from '@/lib/client/status'
import { isToday } from '@/lib/client/dates'
import { api, type Job } from '@/lib/client/api'

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  async function reload() {
    setLoading(true)
    try {
      setJobs(await api.listJobs())
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    reload()
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
    <Shell todayCount={todayCount}>
      {loading ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aún no hay curros. Se añaden desde la API o se sembrarán más adelante.
        </p>
      ) : (
        <EntityTable rows={rows} statusDefs={JOB_STATUSES} onSelect={setSelectedId} />
      )}
      <DetailDrawer
        subjectType="job"
        subjectId={selectedId}
        statusDefs={JOB_STATUSES}
        onClose={() => setSelectedId(null)}
        onChanged={reload}
      />
    </Shell>
  )
}
