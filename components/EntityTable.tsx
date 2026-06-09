'use client'
import { Button, Input } from '@headlessui/react'
import type { StatusDef } from '@/lib/client/status'
import { StatusSelect } from './StatusSelect'
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
  onChangeStatus,
  onChangePriority,
  onToggleStar,
}: {
  rows: TableRow[]
  statusDefs: StatusDef[]
  onSelect: (id: number) => void
  onChangeStatus: (id: number, value: string) => void
  onChangePriority: (id: number, value: number) => void
  onToggleStar: (id: number, value: boolean) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="px-4 py-3 font-medium">Empresa</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Prioridad</th>
            <th className="px-4 py-3 font-medium">Próxima acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="cursor-pointer border-t border-white/5 transition hover:bg-white/[0.04]"
            >
              <td className="px-4 py-3 font-medium text-white">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleStar(r.id, !r.starred)
                  }}
                  aria-label={r.starred ? 'Quitar estrella' : 'Marcar con estrella'}
                  className={
                    'mr-1.5 align-middle transition ' +
                    (r.starred ? 'text-accent' : 'text-neutral-700 hover:text-neutral-400')
                  }
                >
                  ★
                </Button>
                {r.company}
                {r.secondary && (
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    {r.secondary}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusSelect
                  defs={statusDefs}
                  value={r.status}
                  onChange={(v) => onChangeStatus(r.id, v)}
                />
              </td>
              <td className="px-4 py-3">
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
                  className="w-14 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm tabular-nums text-neutral-200 [color-scheme:dark] focus:outline-none data-[focus]:border-white/20"
                />
              </td>
              <td className="px-4 py-3">
                <NextActionCell date={r.next_action} note={r.next_action_note} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
