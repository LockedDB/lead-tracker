import type { StatusDef } from '@/lib/client/status'
import { statusLabel } from '@/lib/client/status'

const TONE: Record<StatusDef['tone'], string> = {
  neutral: 'border-white/10 bg-white/5 text-neutral-400',
  active: 'border-accent/20 bg-accent/10 text-accent',
  won: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  lost: 'border-white/5 bg-white/5 text-neutral-600 line-through',
}

export function StatusBadge({ defs, value }: { defs: StatusDef[]; value: string }) {
  const tone = defs.find((d) => d.value === value)?.tone ?? 'neutral'
  return (
    <span
      className={
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ' + TONE[tone]
      }
    >
      {statusLabel(defs, value)}
    </span>
  )
}
