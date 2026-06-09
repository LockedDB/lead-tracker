import type Database from 'better-sqlite3'

export type Lead = {
  id: number
  company: string
  pipeline_status: string
  vertical: string | null
  channel: string | null
  priority: number
  starred: boolean
  first_contact: string | null
  last_action: string | null
  next_action: string | null
  next_action_note: string | null
  contact_name: string | null
  contact_role: string | null
  linkedin_url: string | null
  app_user_axis: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type LeadInput = Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>> & {
  company: string
}

const COLUMNS = [
  'company', 'pipeline_status', 'vertical', 'channel', 'priority', 'starred',
  'first_contact', 'last_action', 'next_action', 'next_action_note',
  'contact_name', 'contact_role', 'linkedin_url', 'app_user_axis', 'notes',
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

function hydrate(row: any): Lead | undefined {
  if (!row) return undefined
  return { ...row, starred: !!row.starred }
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
    .prepare('SELECT * FROM leads ORDER BY priority DESC, company ASC')
    .all() as any[]
  return rows.map((r) => hydrate(r)!) as Lead[]
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
