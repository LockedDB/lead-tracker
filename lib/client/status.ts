export type StatusDef = { value: string; label: string; tone: 'neutral' | 'active' | 'won' | 'lost' }

export const LEAD_STATUSES: StatusDef[] = [
  { value: 'prospect', label: 'Prospecto', tone: 'neutral' },
  { value: 'contacted', label: 'Contactado', tone: 'active' },
  { value: 'replied', label: 'Respondió', tone: 'active' },
  { value: 'in_conversation', label: 'En conversación', tone: 'active' },
  { value: 'call_scheduled', label: 'Call agendada', tone: 'active' },
  { value: 'proposal_sent', label: 'Propuesta enviada', tone: 'active' },
  { value: 'closed_won', label: 'Ganado', tone: 'won' },
  { value: 'closed_lost', label: 'Perdido', tone: 'lost' },
  { value: 'ghosted', label: 'Ghosteado', tone: 'lost' },
]

export const JOB_STATUSES: StatusDef[] = [
  { value: 'saved', label: 'Guardado', tone: 'neutral' },
  { value: 'applied', label: 'Aplicado', tone: 'active' },
  { value: 'screening', label: 'Screening', tone: 'active' },
  { value: 'interview', label: 'Entrevista', tone: 'active' },
  { value: 'offer', label: 'Oferta', tone: 'won' },
  { value: 'rejected', label: 'Rechazado', tone: 'lost' },
  { value: 'accepted', label: 'Aceptado', tone: 'won' },
  { value: 'withdrawn', label: 'Retirado', tone: 'lost' },
]

export function statusLabel(defs: StatusDef[], value: string): string {
  return defs.find((d) => d.value === value)?.label ?? value
}
