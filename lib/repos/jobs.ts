import type Database from 'better-sqlite3'

export type Job = {
  id: number
  company: string
  role: string | null
  status: string
  location: string | null
  salary_range: string | null
  job_url: string | null
  source: string | null
  priority: number
  starred: boolean
  applied_date: string | null
  last_action: string | null
  next_action: string | null
  next_action_note: string | null
  contact_name: string | null
  contact_role: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type JobInput = Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>> & {
  company: string
}

const COLUMNS = [
  'company', 'role', 'status', 'location', 'salary_range', 'job_url', 'source',
  'priority', 'starred', 'applied_date', 'last_action', 'next_action',
  'next_action_note', 'contact_name', 'contact_role', 'notes',
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

function hydrate(row: any): Job | undefined {
  if (!row) return undefined
  return { ...row, starred: !!row.starred }
}

export function createJob(db: Database.Database, input: JobInput): number {
  const row = toRow(input as Record<string, unknown>)
  const cols = Object.keys(row)
  const placeholders = cols.map((c) => `@${c}`).join(', ')
  const result = db
    .prepare(`INSERT INTO jobs (${cols.join(', ')}) VALUES (${placeholders})`)
    .run(row)
  return Number(result.lastInsertRowid)
}

export function getJob(db: Database.Database, id: number): Job | undefined {
  return hydrate(db.prepare('SELECT * FROM jobs WHERE id = ?').get(id))
}

export function listJobs(db: Database.Database): Job[] {
  const rows = db
    .prepare('SELECT * FROM jobs ORDER BY priority DESC, company ASC')
    .all() as any[]
  return rows.map((r) => hydrate(r)!) as Job[]
}

export function updateJob(
  db: Database.Database,
  id: number,
  input: Partial<JobInput>
): void {
  const row = toRow(input as Record<string, unknown>)
  const cols = Object.keys(row)
  if (cols.length === 0) return
  const assignments = cols.map((c) => `${c} = @${c}`).join(', ')
  db.prepare(
    `UPDATE jobs SET ${assignments}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...row, id })
}

export function deleteJob(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(id)
}
