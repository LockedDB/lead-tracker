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

  it('backfilla sort_order en una DB preexistente sin la columna', () => {
    const db = getDb(':memory:')
    db.exec('CREATE TABLE leads (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL)')
    db.prepare('INSERT INTO leads (company) VALUES (?)').run('Banana')
    db.prepare('INSERT INTO leads (company) VALUES (?)').run('Ananas')
    migrate(db)
    const rows = db
      .prepare('SELECT company, sort_order FROM leads ORDER BY sort_order ASC')
      .all() as { company: string; sort_order: number }[]
    expect(rows.map((r) => r.company)).toEqual(['Ananas', 'Banana'])
    expect(rows.map((r) => r.sort_order)).toEqual([0, 1])
  })

  it('elimina la columna priority en una DB preexistente', () => {
    const db = getDb(':memory:')
    db.exec(
      'CREATE TABLE leads (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, priority INTEGER NOT NULL DEFAULT 5)',
    )
    migrate(db)
    const cols = db.prepare('PRAGMA table_info(leads)').all() as { name: string }[]
    expect(cols.some((c) => c.name === 'priority')).toBe(false)
  })
})
