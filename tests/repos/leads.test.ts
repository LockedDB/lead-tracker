import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { createLead, getLead, listLeads, updateLead, deleteLead } from '@/lib/repos/leads'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('leads repo', () => {
  it('crea y lee un lead', () => {
    const id = createLead(db, { company: 'Lyfta', priority: 9, starred: true })
    const lead = getLead(db, id)
    expect(lead?.company).toBe('Lyfta')
    expect(lead?.priority).toBe(9)
    expect(lead?.starred).toBe(true)
    expect(lead?.pipeline_status).toBe('prospect')
  })

  it('lista leads ordenados por prioridad desc', () => {
    createLead(db, { company: 'A', priority: 3 })
    createLead(db, { company: 'B', priority: 8 })
    const all = listLeads(db)
    expect(all.map((l) => l.company)).toEqual(['B', 'A'])
  })

  it('actualiza y borra', () => {
    const id = createLead(db, { company: 'C' })
    updateLead(db, id, { pipeline_status: 'contacted' })
    expect(getLead(db, id)?.pipeline_status).toBe('contacted')
    deleteLead(db, id)
    expect(getLead(db, id)).toBeUndefined()
  })
})
