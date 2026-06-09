'use client'
import { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { EntityTable, type TableRow } from '@/components/EntityTable'
import { DetailDrawer } from '@/components/DetailDrawer'
import { LEAD_STATUSES } from '@/lib/client/status'
import { isToday } from '@/lib/client/dates'
import { api, type Lead } from '@/lib/client/api'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  async function reload() {
    setLoading(true)
    try {
      setLeads(await api.listLeads())
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    reload()
  }, [])

  const rows: TableRow[] = leads.map((l) => ({
    id: l.id,
    company: l.company,
    secondary: l.vertical,
    status: l.pipeline_status,
    priority: l.priority,
    starred: l.starred,
    next_action: l.next_action,
    next_action_note: l.next_action_note,
  }))
  const todayCount = leads.filter((l) => isToday(l.next_action)).length

  return (
    <Shell todayCount={todayCount}>
      {loading ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : (
        <EntityTable rows={rows} statusDefs={LEAD_STATUSES} onSelect={setSelectedId} />
      )}
      <DetailDrawer
        subjectType="lead"
        subjectId={selectedId}
        statusDefs={LEAD_STATUSES}
        onClose={() => setSelectedId(null)}
        onChanged={reload}
      />
    </Shell>
  )
}
