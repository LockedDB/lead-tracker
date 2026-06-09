import type Database from 'better-sqlite3'

export type Generation = {
  id: number
  subject_type: 'lead' | 'job'
  subject_id: number
  kind: 'outreach_email' | 'cover_letter'
  content: string
  template_used: string | null
  generator: 'cli' | 'api'
  created_at: string
}

export type GenerationInput = Omit<Generation, 'id' | 'created_at'>

export function saveGeneration(db: Database.Database, input: GenerationInput): number {
  const result = db
    .prepare(
      `INSERT INTO generations
       (subject_type, subject_id, kind, content, template_used, generator)
       VALUES (@subject_type, @subject_id, @kind, @content, @template_used, @generator)`
    )
    .run(input)
  return Number(result.lastInsertRowid)
}

export function listGenerations(
  db: Database.Database,
  subjectType: 'lead' | 'job',
  subjectId: number
): Generation[] {
  return db
    .prepare(
      `SELECT * FROM generations
       WHERE subject_type = ? AND subject_id = ?
       ORDER BY id DESC`
    )
    .all(subjectType, subjectId) as Generation[]
}
