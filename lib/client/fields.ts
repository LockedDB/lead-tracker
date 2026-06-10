import { LEAD_STATUSES, JOB_STATUSES } from './status'

export type FieldType = 'text' | 'date' | 'number' | 'select' | 'textarea'

export type FieldDef = {
  key: string
  label: string
  type: FieldType
  options?: { value: string; label: string }[]
  required?: boolean
  // 'side' = metadatos estructurados (sidebar); 'main' = contenido de trabajo (centro)
  pane?: 'side' | 'main'
}

const CHANNELS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'intro', label: 'Intro' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'other', label: 'Otro' },
]

const APP_USER_AXES = [
  { value: 'b2c', label: 'B2C' },
  { value: 'internal', label: 'Internal' },
  { value: 'product', label: 'Product' },
  { value: 'unclear', label: 'Unclear' },
]

const JOB_SOURCES = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'infojobs', label: 'InfoJobs' },
  { value: 'web', label: 'Web' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Otro' },
]

const statusOptions = (defs: { value: string; label: string }[]) =>
  defs.map((d) => ({ value: d.value, label: d.label }))

export const LEAD_FIELDS: FieldDef[] = [
  { key: 'pipeline_status', label: 'Estado', type: 'select', options: statusOptions(LEAD_STATUSES), required: true },
  { key: 'vertical', label: 'Vertical', type: 'text' },
  { key: 'channel', label: 'Canal', type: 'select', options: CHANNELS },
  { key: 'first_contact', label: 'Primer contacto', type: 'date' },
  { key: 'last_action', label: 'Última acción', type: 'date' },
  { key: 'next_action', label: 'Próxima acción', type: 'date', pane: 'main' },
  { key: 'app_user_axis', label: 'Eje de usuario', type: 'select', options: APP_USER_AXES },
  { key: 'contact_name', label: 'Contacto', type: 'text' },
  { key: 'contact_role', label: 'Rol del contacto', type: 'text' },
  { key: 'linkedin_url', label: 'LinkedIn URL', type: 'text' },
  { key: 'next_action_note', label: 'Nota de próxima acción', type: 'text', pane: 'main' },
  { key: 'about', label: 'Sobre la empresa', type: 'textarea', pane: 'main' },
  { key: 'notes', label: 'Notas', type: 'textarea', pane: 'main' },
]

export const JOB_FIELDS: FieldDef[] = [
  { key: 'status', label: 'Estado', type: 'select', options: statusOptions(JOB_STATUSES), required: true },
  { key: 'role', label: 'Rol', type: 'text' },
  { key: 'location', label: 'Ubicación', type: 'text' },
  { key: 'salary_range', label: 'Salario', type: 'text' },
  { key: 'source', label: 'Fuente', type: 'select', options: JOB_SOURCES },
  { key: 'applied_date', label: 'Fecha de aplicación', type: 'date' },
  { key: 'last_action', label: 'Última acción', type: 'date' },
  { key: 'next_action', label: 'Próxima acción', type: 'date', pane: 'main' },
  { key: 'contact_name', label: 'Contacto', type: 'text' },
  { key: 'contact_role', label: 'Rol del contacto', type: 'text' },
  { key: 'job_url', label: 'URL de la oferta', type: 'text' },
  { key: 'next_action_note', label: 'Nota de próxima acción', type: 'text', pane: 'main' },
  { key: 'about', label: 'Sobre la empresa', type: 'textarea', pane: 'main' },
  { key: 'notes', label: 'Notas', type: 'textarea', pane: 'main' },
]
