import { describe, it, expect } from 'vitest'
import { parseLeadMarkdown } from '@/lib/import/parse-lead'

const SAMPLE = `---
kind: lead
razon_social: Activate Personal Training Barcelona
pipeline_status: prospect
vertical: fitness
channel: instagram
priority: 7
starred: false
last_action: 2026-05-15
next_action_note: research pendiente
app_user_axis: b2c
tags:
  - lead
  - captacion
---

# Activate Personal Training

Track: greenfield — booking de personal training.
`

describe('parseLeadMarkdown', () => {
  it('mapea frontmatter y body a LeadInput', () => {
    const lead = parseLeadMarkdown(SAMPLE, 'Activate Personal Training.md')
    expect(lead.company).toBe('Activate Personal Training')
    expect(lead.pipeline_status).toBe('prospect')
    expect(lead.vertical).toBe('fitness')
    expect(lead.channel).toBe('instagram')
    expect(lead.priority).toBe(7)
    expect(lead.starred).toBe(false)
    expect(lead.app_user_axis).toBe('b2c')
    expect(lead.notes).toContain('Track: greenfield')
  })

  it('usa el nombre de fichero como company si no hay heading', () => {
    const lead = parseLeadMarkdown('---\nkind: lead\n---\n\nsolo body', 'Drimer.md')
    expect(lead.company).toBe('Drimer')
  })
})
