import { isToday, isOverdue } from '@/lib/client/dates'

export function NextActionCell({
  date,
  note,
}: {
  date: string | null
  note: string | null
}) {
  const today = isToday(date)
  const overdue = isOverdue(date)
  const text = note || (date ? date : '—')
  const cls = today || overdue ? 'text-accent font-semibold' : 'text-neutral-500'
  const prefix = today ? 'hoy · ' : overdue ? 'atrasado · ' : ''
  return <span className={cls}>{text === '—' ? '—' : prefix + text}</span>
}
