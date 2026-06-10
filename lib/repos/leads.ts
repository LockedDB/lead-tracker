import type Database from 'better-sqlite3'

export type Lead = {
  id: number
  company: string
  pipeline_status: string
  vertical: string | null
  channel: string | null
  starred: boolean
  sort_order: number
  first_contact: string | null
  last_action: string | null
  next_action: string | null
  next_action_note: string | null
  contact_name: string | null
  contact_role: string | null
  linkedin_url: string | null
  app_user_axis: string | null
  about: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type LeadInput = Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>> & {
  company: string
}

const COLUMNS = [
  'company', 'pipeline_status', 'vertical', 'channel', 'starred',
  'sort_order', 'first_contact', 'last_action', 'next_action', 'next_action_note',
  'contact_name', 'contact_role', 'linkedin_url', 'app_user_axis', 'about', 'notes',
] as const

function toRow(input: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const col of COLUMNS) {
    if (col in input) {
      const v = input[col]
      row[col] = typeof v === 'boolean' ? (v ? 1 : 0) : v
    }
  }
  return row
}

function hydrate(row: unknown): Lead | undefined {
  if (!row) return undefined
  const r = row as Record<string, unknown>
  return { ...r, starred: !!r.starred } as Lead
}

export function createLead(db: Database.Database, input: LeadInput): number {
  const row = toRow(input as Record<string, unknown>)
  const cols = Object.keys(row)
  const placeholders = cols.map((c) => `@${c}`).join(', ')
  const stmt = db.prepare(
    `INSERT INTO leads (${cols.join(', ')}) VALUES (${placeholders})`
  )
  const result = stmt.run(row)
  return Number(result.lastInsertRowid)
}

export function getLead(db: Database.Database, id: number): Lead | undefined {
  return hydrate(db.prepare('SELECT * FROM leads WHERE id = ?').get(id))
}

export function listLeads(db: Database.Database): Lead[] {
  const rows = db
    .prepare('SELECT * FROM leads ORDER BY sort_order ASC, company ASC')
    .all() as Record<string, unknown>[]
  return rows.map((r) => hydrate(r)!) as Lead[]
}

// Reasigna sort_order = posición a la lista de ids recibida (orden global completo
// que manda el cliente tras un drag). El agrupado por estado se hace en el cliente,
// así que aquí solo persistimos la secuencia.
export function reorderLeads(db: Database.Database, ids: number[]): void {
  const upd = db.prepare('UPDATE leads SET sort_order = ? WHERE id = ?')
  const apply = db.transaction((list: number[]) => {
    list.forEach((id, i) => upd.run(i, id))
  })
  apply(ids)
}

export function updateLead(
  db: Database.Database,
  id: number,
  input: Partial<LeadInput>
): void {
  const row = toRow(input as Record<string, unknown>)
  const cols = Object.keys(row)
  if (cols.length === 0) return
  const assignments = cols.map((c) => `${c} = @${c}`).join(', ')
  db.prepare(
    `UPDATE leads SET ${assignments}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...row, id })
}

export function deleteLead(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM leads WHERE id = ?').run(id)
}
