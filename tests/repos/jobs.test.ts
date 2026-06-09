import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { createJob, getJob, listJobs, updateJob, deleteJob, reorderJobs } from '@/lib/repos/jobs'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('jobs repo', () => {
  it('crea y lee un job', () => {
    const id = createJob(db, { company: 'Stripe', role: 'iOS Engineer' })
    const job = getJob(db, id)
    expect(job?.company).toBe('Stripe')
    expect(job?.role).toBe('iOS Engineer')
    expect(job?.status).toBe('saved')
  })

  it('actualiza estado y borra', () => {
    const id = createJob(db, { company: 'X' })
    updateJob(db, id, { status: 'applied' })
    expect(getJob(db, id)?.status).toBe('applied')
    deleteJob(db, id)
    expect(getJob(db, id)).toBeUndefined()
  })

  it('lista por sort_order asc', () => {
    createJob(db, { company: 'Segundo', sort_order: 2 })
    createJob(db, { company: 'Primero', sort_order: 1 })
    expect(listJobs(db).map((j) => j.company)).toEqual(['Primero', 'Segundo'])
  })

  it('reorderJobs reasigna sort_order a la secuencia dada', () => {
    const a = createJob(db, { company: 'A' })
    const b = createJob(db, { company: 'B' })
    const c = createJob(db, { company: 'C' })
    reorderJobs(db, [c, a, b])
    expect(listJobs(db).map((j) => j.company)).toEqual(['C', 'A', 'B'])
  })
})
