'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { Shell } from '@/components/Shell'
import { DetailModal } from '@/components/DetailModal'
import { TableSkeleton } from '@/components/TableSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LEAD_STATUSES } from '@/lib/client/status'
import { LEAD_FIELDS } from '@/lib/client/fields'
import { buildFollowupQueue, type FollowupItem } from '@/lib/client/followup'
import { todayISO } from '@/lib/client/dates'
import { api, type Lead } from '@/lib/client/api'
import { cn } from '@/lib/utils'

const headClass = 'text-muted-foreground text-xs font-medium uppercase tracking-wide'
const COL_COUNT = 4

function GroupRow({ label, hint, count }: { label: string; hint: string; count: number }) {
  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={COL_COUNT} className="bg-muted/40 py-2">
        <span className="inline-flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight">{label}</span>
          <span className="text-muted-foreground text-xs">{hint}</span>
          <span className="text-muted-foreground text-xs tabular-nums">· {count}</span>
        </span>
      </TableCell>
    </TableRow>
  )
}

function QueueRow({
  item,
  showNextDue,
  onSelect,
}: {
  item: FollowupItem
  showNextDue?: boolean
  onSelect: (id: number) => void
}) {
  const { lead, reason, nextDue } = item
  return (
    <TableRow onClick={() => onSelect(lead.id)} className="cursor-pointer">
      <TableCell className="font-medium">
        <span className="inline-flex items-center gap-1.5">
          {lead.starred && <Star className="text-primary size-3.5 shrink-0 fill-current" />}
          {lead.company}
          {lead.contact_name && (
            <span className="text-muted-foreground text-xs font-normal">· {lead.contact_name}</span>
          )}
        </span>
      </TableCell>
      <TableCell>
        <StatusBadge defs={LEAD_STATUSES} value={lead.pipeline_status} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{reason}</TableCell>
      <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
        {showNextDue && nextDue ? nextDue : ''}
      </TableCell>
    </TableRow>
  )
}

export default function TodayPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLeads(await api.listLeads())
    setLoading(false)
  }, [])

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

  const { due, upcoming, needsDate } = useMemo(
    () => buildFollowupQueue(leads, todayISO()),
    [leads],
  )
  const empty = due.length === 0 && upcoming.length === 0 && needsDate.length === 0

  return (
    <Shell todayCount={due.length}>
      {loading ? (
        <TableSkeleton />
      ) : empty ? (
        <EmptyState
          title="Nada que seguir hoy"
          description="No hay clientes contactados pendientes de follow-up. Contacta prospects nuevos desde la pestaña Clientes."
        />
      ) : (
        <div className="bg-card overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={headClass}>Empresa</TableHead>
                <TableHead className={headClass}>Estado</TableHead>
                <TableHead className={headClass}>Por qué</TableHead>
                <TableHead className={cn(headClass, 'text-right')}>Próximo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <GroupRow label="Para hoy" hint="por probabilidad de cierre" count={due.length} />
              {due.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={COL_COUNT}
                    className="text-muted-foreground py-6 text-center text-sm"
                  >
                    Nada vencido hoy. Vas al día.
                  </TableCell>
                </TableRow>
              ) : (
                due.map((item) => (
                  <QueueRow key={item.lead.id} item={item} onSelect={setSelectedId} />
                ))
              )}

              {upcoming.length > 0 && (
                <>
                  <GroupRow label="Próximos toques" hint="aún no toca" count={upcoming.length} />
                  {upcoming.map((item) => (
                    <QueueRow key={item.lead.id} item={item} showNextDue onSelect={setSelectedId} />
                  ))}
                </>
              )}

              {needsDate.length > 0 && (
                <>
                  <GroupRow label="Faltan datos" hint="pon una fecha" count={needsDate.length} />
                  {needsDate.map((item) => (
                    <QueueRow key={item.lead.id} item={item} onSelect={setSelectedId} />
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <DetailModal
        subjectType="lead"
        subjectId={selectedId}
        creating={false}
        fields={LEAD_FIELDS}
        onClose={() => setSelectedId(null)}
        onChanged={reload}
      />
    </Shell>
  )
}
