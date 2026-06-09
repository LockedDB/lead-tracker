export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isToday(date: string | null | undefined, today = todayISO()): boolean {
  return !!date && date.slice(0, 10) === today
}

export function isOverdue(date: string | null | undefined, today = todayISO()): boolean {
  return !!date && date.slice(0, 10) < today
}
