import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { createLead, getLead, listLeads, updateLead, deleteLead, reorderLeads } from '@/lib/repos/leads'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('leads repo', () => {
  it('crea y lee un lead', () => {
    const id = createLead(db, { company: 'Lyfta', starred: true })
    const lead = getLead(db, id)
    expect(lead?.company).toBe('Lyfta')
    expect(lead?.starred).toBe(true)
    expect(lead?.pipeline_status).toBe('prospect')
  })

  it('lista leads ordenados por sort_order asc', () => {
    createLead(db, { company: 'A', sort_order: 2 })
    createLead(db, { company: 'B', sort_order: 1 })
    const all = listLeads(db)
    expect(all.map((l) => l.company)).toEqual(['B', 'A'])
  })

  it('reorderLeads reasigna sort_order a la secuencia dada', () => {
    const a = createLead(db, { company: 'A' })
    const b = createLead(db, { company: 'B' })
    const c = createLead(db, { company: 'C' })
    reorderLeads(db, [c, a, b])
    expect(listLeads(db).map((l) => l.company)).toEqual(['C', 'A', 'B'])
  })

  it('actualiza y borra', () => {
    const id = createLead(db, { company: 'C' })
    updateLead(db, id, { pipeline_status: 'contacted' })
    expect(getLead(db, id)?.pipeline_status).toBe('contacted')
    deleteLead(db, id)
    expect(getLead(db, id)).toBeUndefined()
  })
})
