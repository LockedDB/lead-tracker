import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { createJob, getJob, listJobs, updateJob, deleteJob } from '@/lib/repos/jobs'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('jobs repo', () => {
  it('crea y lee un job', () => {
    const id = createJob(db, { company: 'Stripe', role: 'iOS Engineer', priority: 8 })
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

  it('lista por prioridad desc', () => {
    createJob(db, { company: 'Low', priority: 2 })
    createJob(db, { company: 'High', priority: 9 })
    expect(listJobs(db).map((j) => j.company)).toEqual(['High', 'Low'])
  })
})
