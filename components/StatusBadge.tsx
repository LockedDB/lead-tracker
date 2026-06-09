import type { StatusDef } from '@/lib/client/status'
import { statusLabel } from '@/lib/client/status'

const TONE: Record<StatusDef['tone'], string> = {
  neutral: 'bg-neutral-100 text-neutral-600',
  active: 'bg-accent-soft text-accent',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-neutral-100 text-neutral-400 line-through',
}

export function StatusBadge({ defs, value }: { defs: StatusDef[]; value: string }) {
  const tone = defs.find((d) => d.value === value)?.tone ?? 'neutral'
  return (
    <span className={'rounded-full px-2.5 py-0.5 text-xs font-medium ' + TONE[tone]}>
      {statusLabel(defs, value)}
    </span>
  )
}
