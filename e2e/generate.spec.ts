import { test, expect } from '@playwright/test'

test('POST /api/generate runs live generation via claude CLI', async ({ request }) => {
  test.skip(process.env.RUN_GENERATE !== '1', 'set RUN_GENERATE=1 to run live generation')
  test.setTimeout(90000)

  const leadsRes = await request.get('/api/leads')
  expect(leadsRes.status()).toBe(200)
  const leads = await leadsRes.json()
  expect(leads.length).toBeGreaterThan(0)
  const subjectId = leads[0].id

  const res = await request.post('/api/generate', {
    data: { subjectType: 'lead', subjectId, templateId: 1 },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.content).toBeTruthy()
  expect(body.content.length).toBeGreaterThan(0)
  expect(body.generator).toBe('cli')
})
