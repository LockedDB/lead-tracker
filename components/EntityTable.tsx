'use client'
import type { StatusDef } from '@/lib/client/status'
import { StatusBadge } from './StatusBadge'
import { NextActionCell } from './NextActionCell'

export type TableRow = {
  id: number
  company: string
  secondary: string | null // role (jobs) o vertical (leads)
  status: string
  priority: number
  starred: boolean
  next_action: string | null
  next_action_note: string | null
}

export function EntityTable({
  rows,
  statusDefs,
  onSelect,
}: {
  rows: TableRow[]
  statusDefs: StatusDef[]
  onSelect: (id: number) => void
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
          <th className="px-3 py-2 font-medium">Empresa</th>
          <th className="px-3 py-2 font-medium">Estado</th>
          <th className="px-3 py-2 font-medium">Prioridad</th>
          <th className="px-3 py-2 font-medium">Próxima acción</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50"
          >
            <td className="px-3 py-2.5 font-medium">
              {r.starred && <span className="mr-1 text-accent">★</span>}
              {r.company}
              {r.secondary && (
                <span className="ml-2 text-xs text-neutral-400">{r.secondary}</span>
              )}
            </td>
            <td className="px-3 py-2.5">
              <StatusBadge defs={statusDefs} value={r.status} />
            </td>
            <td className="px-3 py-2.5 tabular-nums text-neutral-600">{r.priority}</td>
            <td className="px-3 py-2.5">
              <NextActionCell date={r.next_action} note={r.next_action_note} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
