import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { seedTemplates, listTemplates } from '@/lib/repos/templates'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('templates repo', () => {
  it('seed inserta una plantilla de cada kind y es idempotente', () => {
    seedTemplates(db)
    seedTemplates(db)
    const all = listTemplates(db)
    const kinds = all.map((t) => t.kind).sort()
    expect(kinds).toContain('outreach_email')
    expect(kinds).toContain('cover_letter')
    expect(all.length).toBe(2)
  })
})
