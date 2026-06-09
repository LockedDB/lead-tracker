import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { saveGeneration, listGenerations } from '@/lib/repos/generations'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('generations repo', () => {
  it('guarda y lista por sujeto, más reciente primero', () => {
    saveGeneration(db, {
      subject_type: 'lead', subject_id: 1, kind: 'outreach_email',
      content: 'primero', template_used: 'X', generator: 'cli',
    })
    saveGeneration(db, {
      subject_type: 'lead', subject_id: 1, kind: 'outreach_email',
      content: 'segundo', template_used: 'X', generator: 'cli',
    })
    saveGeneration(db, {
      subject_type: 'job', subject_id: 1, kind: 'cover_letter',
      content: 'otra', template_used: 'Y', generator: 'cli',
    })
    const forLead = listGenerations(db, 'lead', 1)
    expect(forLead.length).toBe(2)
    expect(forLead[0].content).toBe('segundo')
  })
})
