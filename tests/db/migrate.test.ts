import { describe, it, expect } from 'vitest'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'

describe('migrate', () => {
  it('crea las 4 tablas', () => {
    const db = getDb(':memory:')
    migrate(db)
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[]
    const names = rows.map((r) => r.name)
    expect(names).toContain('leads')
    expect(names).toContain('jobs')
    expect(names).toContain('templates')
    expect(names).toContain('generations')
  })
})
