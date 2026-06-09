import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StatusDef, StatusTone } from '@/lib/client/status'
import { statusLabel } from '@/lib/client/status'

const TONE: Record<StatusTone, string> = {
  slate: 'border-slate-300 bg-slate-100 text-slate-700',
  blue: 'border-blue-300 bg-blue-100 text-blue-700',
  teal: 'border-teal-300 bg-teal-100 text-teal-700',
  violet: 'border-violet-300 bg-violet-100 text-violet-700',
  fuchsia: 'border-fuchsia-300 bg-fuchsia-100 text-fuchsia-700',
  amber: 'border-amber-300 bg-amber-100 text-amber-800',
  emerald: 'border-emerald-300 bg-emerald-100 text-emerald-700',
  rose: 'border-rose-300 bg-rose-100 text-rose-700',
  zinc: 'border-zinc-300 bg-zinc-100 text-zinc-500 line-through',
}

export function StatusBadge({ defs, value }: { defs: StatusDef[]; value: string }) {
  const tone = defs.find((d) => d.value === value)?.tone ?? 'slate'
  return (
    <Badge variant="outline" className={cn('rounded-full', TONE[tone])}>
      {statusLabel(defs, value)}
    </Badge>
  )
}
