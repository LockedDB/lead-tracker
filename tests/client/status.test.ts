import { describe, it, expect } from 'vitest'
import { LEAD_STATUSES, JOB_STATUSES, statusLabel } from '@/lib/client/status'

describe('status maps', () => {
  it('lead statuses incluyen el flujo completo', () => {
    expect(LEAD_STATUSES.map((s) => s.value)).toContain('proposal_sent')
    expect(LEAD_STATUSES.map((s) => s.value)).toContain('closed_won')
  })
  it('job statuses incluyen interview y offer', () => {
    expect(JOB_STATUSES.map((s) => s.value)).toContain('interview')
    expect(JOB_STATUSES.map((s) => s.value)).toContain('offer')
  })
  it('statusLabel devuelve el label legible', () => {
    expect(statusLabel(LEAD_STATUSES, 'replied')).toBe('Respondió')
  })
})
