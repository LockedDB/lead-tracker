import { describe, it, expect } from 'vitest'
import type { Lead } from '@/lib/repos/leads'
import { scoreFollowup, buildFollowupQueue } from '@/lib/client/followup'

const today = '2026-06-09'

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 1,
    company: 'Acme',
    pipeline_status: 'contacted',
    vertical: null,
    channel: null,
    starred: false,
    sort_order: 0,
    first_contact: null,
    last_action: null,
    next_action: null,
    next_action_note: null,
    contact_name: null,
    contact_role: null,
    linkedin_url: null,
    app_user_axis: null,
    notes: null,
    created_at: today,
    updated_at: today,
    ...overrides,
  }
}

describe('buildFollowupQueue', () => {
  it('excluye prospects y cerrados', () => {
    const leads = [
      lead({ id: 1, pipeline_status: 'prospect', last_action: '2026-01-01' }),
      lead({ id: 2, pipeline_status: 'closed_won', last_action: '2026-01-01' }),
      lead({ id: 3, pipeline_status: 'closed_lost', last_action: '2026-01-01' }),
      lead({ id: 4, pipeline_status: 'contacted', last_action: '2026-01-01' }),
    ]
    const { due, upcoming } = buildFollowupQueue(leads, today)
    const ids = [...due, ...upcoming].map((i) => i.lead.id)
    expect(ids).toEqual([4])
  })

  it('ordena por warmth: propuesta enviada por encima de contactado', () => {
    const leads = [
      lead({ id: 1, pipeline_status: 'contacted', last_action: '2026-05-01' }),
      lead({ id: 2, pipeline_status: 'proposal_sent', last_action: '2026-05-01' }),
    ]
    const { due } = buildFollowupQueue(leads, today)
    expect(due.map((i) => i.lead.id)).toEqual([2, 1])
  })
})

describe('scoreFollowup — cadencia', () => {
  it('contacted vence a los 3 días', () => {
    expect(scoreFollowup(lead({ last_action: '2026-06-06' }), today).due).toBe(true)
    expect(scoreFollowup(lead({ last_action: '2026-06-07' }), today).due).toBe(false)
  })

  it('replied vence al día siguiente (cadencia más apretada en caliente)', () => {
    const l = lead({ pipeline_status: 'replied', last_action: '2026-06-08' })
    expect(scoreFollowup(l, today).due).toBe(true)
  })

  it('usa first_contact si no hay last_action', () => {
    const l = lead({ last_action: null, first_contact: '2026-06-01' })
    const item = scoreFollowup(l, today)
    expect(item.daysSince).toBe(8)
    expect(item.due).toBe(true)
  })

  it('sin ninguna fecha → needsDate, no urgente', () => {
    const item = scoreFollowup(lead({ last_action: null, first_contact: null }), today)
    expect(item.needsDate).toBe(true)
    expect(item.due).toBe(false)
    expect(item.score).toBe(0)
    expect(item.reason).toMatch(/falta fecha/i)
  })

  it('sin último toque pero con next_action futura → programado, no needsDate', () => {
    const item = scoreFollowup(
      lead({ last_action: null, first_contact: null, next_action: '2026-06-20' }),
      today,
    )
    expect(item.needsDate).toBe(false)
    expect(item.due).toBe(false)
    expect(item.nextDue).toBe('2026-06-20')
  })

  it('calcula nextDue para los que aún no vencen', () => {
    const item = scoreFollowup(lead({ last_action: '2026-06-08' }), today)
    expect(item.due).toBe(false)
    expect(item.nextDue).toBe('2026-06-11')
  })
})

describe('scoreFollowup — next_action manda', () => {
  it('next_action vencida fuerza due aunque se haya tocado hoy', () => {
    const l = lead({ last_action: today, next_action: '2026-06-05', next_action_note: 'Mandar Loom' })
    const item = scoreFollowup(l, today)
    expect(item.due).toBe(true)
    expect(item.reason).toContain('Mandar Loom')
  })

  it('next_action futura no fuerza due', () => {
    const l = lead({ last_action: today, next_action: '2026-06-20' })
    expect(scoreFollowup(l, today).due).toBe(false)
  })
})

describe('scoreFollowup — boosts', () => {
  it('starred sube el score frente a un idéntico sin estrella', () => {
    const base = { last_action: '2026-05-01' as const }
    const starred = scoreFollowup(lead({ ...base, starred: true }), today).score
    const plain = scoreFollowup(lead({ ...base, starred: false }), today).score
    expect(starred).toBeGreaterThan(plain)
  })

  it('más vencido → más score (a igualdad de estado)', () => {
    const old = scoreFollowup(lead({ last_action: '2026-05-01' }), today).score
    const recent = scoreFollowup(lead({ last_action: '2026-06-05' }), today).score
    expect(old).toBeGreaterThan(recent)
  })
})

describe('scoreFollowup — ghosted', () => {
  it('vence a los 30 días como intento de revival', () => {
    const stale = scoreFollowup(lead({ pipeline_status: 'ghosted', last_action: '2026-04-01' }), today)
    expect(stale.due).toBe(true)
    expect(stale.reason).toMatch(/revival/i)

    const fresh = scoreFollowup(lead({ pipeline_status: 'ghosted', last_action: '2026-06-01' }), today)
    expect(fresh.due).toBe(false)
  })
})
