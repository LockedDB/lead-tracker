export type StatusTone =
  | 'slate'
  | 'blue'
  | 'teal'
  | 'violet'
  | 'fuchsia'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'zinc'

export type StatusDef = { value: string; label: string; tone: StatusTone }

export const LEAD_STATUSES: StatusDef[] = [
  { value: 'prospect', label: 'Prospecto', tone: 'slate' },
  { value: 'contacted', label: 'Contactado', tone: 'blue' },
  { value: 'replied', label: 'Respondió', tone: 'teal' },
  { value: 'in_conversation', label: 'En conversación', tone: 'violet' },
  { value: 'call_scheduled', label: 'Call agendada', tone: 'fuchsia' },
  { value: 'proposal_sent', label: 'Propuesta enviada', tone: 'amber' },
  { value: 'closed_won', label: 'Ganado', tone: 'emerald' },
  { value: 'closed_lost', label: 'Perdido', tone: 'rose' },
  { value: 'ghosted', label: 'Ghosteado', tone: 'zinc' },
]

export const JOB_STATUSES: StatusDef[] = [
  { value: 'saved', label: 'Guardado', tone: 'slate' },
  { value: 'applied', label: 'Aplicado', tone: 'blue' },
  { value: 'screening', label: 'Screening', tone: 'teal' },
  { value: 'interview', label: 'Entrevista', tone: 'violet' },
  { value: 'offer', label: 'Oferta', tone: 'amber' },
  { value: 'accepted', label: 'Aceptado', tone: 'emerald' },
  { value: 'rejected', label: 'Rechazado', tone: 'rose' },
  { value: 'withdrawn', label: 'Retirado', tone: 'zinc' },
]

export function statusLabel(defs: StatusDef[], value: string): string {
  return defs.find((d) => d.value === value)?.label ?? value
}

// Rank de un estado = su índice en el array de definiciones (orden de embudo).
// Los estados desconocidos van al final. Es la única fuente de verdad del orden
// por estado: la tabla agrupa y ordena con esto, no hay rank duplicado en SQL.
export function statusRank(defs: StatusDef[], value: string): number {
  const i = defs.findIndex((d) => d.value === value)
  return i === -1 ? defs.length : i
}
