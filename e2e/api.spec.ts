import { test, expect } from '@playwright/test'

test('GET /api/leads returns at least 40 leads with required fields', async ({ request }) => {
  const res = await request.get('/api/leads')
  expect(res.status()).toBe(200)
  const leads = await res.json()
  expect(Array.isArray(leads)).toBe(true)
  expect(leads.length).toBeGreaterThanOrEqual(40)
  for (const lead of leads) {
    expect(lead).toHaveProperty('company')
    expect(lead).toHaveProperty('pipeline_status')
  }
})

test('GET /api/templates returns the 2 seed templates', async ({ request }) => {
  const res = await request.get('/api/templates')
  expect(res.status()).toBe(200)
  const templates = await res.json()
  expect(templates).toHaveLength(2)
  const kinds = templates.map((t: { kind: string }) => t.kind)
  expect(kinds).toContain('outreach_email')
  expect(kinds).toContain('cover_letter')
})

test('leads CRUD lifecycle', async ({ request }) => {
  const createRes = await request.post('/api/leads', {
    data: { company: 'PlaywrightCo', priority: 7, starred: true },
  })
  expect(createRes.status()).toBe(201)
  const { id } = await createRes.json()
  expect(id).toBeTruthy()

  const getRes = await request.get(`/api/leads/${id}`)
  expect(getRes.status()).toBe(200)
  const lead = await getRes.json()
  expect(lead.company).toBe('PlaywrightCo')
  expect(lead.starred).toBe(true)

  const patchRes = await request.patch(`/api/leads/${id}`, {
    data: { pipeline_status: 'contacted' },
  })
  expect(patchRes.status()).toBe(200)
  const updated = await patchRes.json()
  expect(updated.pipeline_status).toBe('contacted')

  const deleteRes = await request.delete(`/api/leads/${id}`)
  expect(deleteRes.status()).toBe(200)

  const gone = await request.get(`/api/leads/${id}`)
  expect(gone.status()).toBe(404)
})

test('jobs create and delete lifecycle', async ({ request }) => {
  const createRes = await request.post('/api/jobs', {
    data: { company: 'PwJob', role: 'iOS Engineer' },
  })
  expect(createRes.status()).toBe(201)
  const { id } = await createRes.json()
  expect(id).toBeTruthy()

  const getRes = await request.get(`/api/jobs/${id}`)
  expect(getRes.status()).toBe(200)
  const job = await getRes.json()
  expect(job.role).toBe('iOS Engineer')

  const deleteRes = await request.delete(`/api/jobs/${id}`)
  expect(deleteRes.status()).toBe(200)
})

test('POST /api/leads without company returns 400', async ({ request }) => {
  const res = await request.post('/api/leads', { data: {} })
  expect(res.status()).toBe(400)
})

test('PATCH /api/leads with null body returns 400', async ({ request }) => {
  const listRes = await request.get('/api/leads')
  expect(listRes.status()).toBe(200)
  const leads = await listRes.json()
  const existingId = leads[0].id

  const res = await request.patch(`/api/leads/${existingId}`, { data: null })
  expect(res.status()).toBe(400)
})

test('POST /api/generate with invalid subjectType returns 400', async ({ request }) => {
  const res = await request.post('/api/generate', {
    data: { subjectType: 'bogus', subjectId: 1, templateId: 1 },
  })
  expect(res.status()).toBe(400)
})
