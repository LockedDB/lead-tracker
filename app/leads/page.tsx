'use client'
import { useEffect, useState } from 'react'
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

  async function load() {
    setLeads(await api.listLeads())
    setLoading(false)
  }
  const reload = () => load()
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

  const rows: EntityRow[] = leads.map((l) => ({
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
          onChangeStatus={(id, v) => api.updateLead(id, { pipeline_status: v }).then(reload)}
          onChangePriority={(id, v) => api.updateLead(id, { priority: v }).then(reload)}
          onToggleStar={(id, v) => api.updateLead(id, { starred: v }).then(reload)}
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
