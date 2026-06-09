import { describe, it, expect } from 'vitest'
import { buildPrompt } from '@/lib/generation/prompt'

describe('buildPrompt', () => {
  it('incluye plantilla, contexto, instrucciones extra y reglas', () => {
    const prompt = buildPrompt({
      kind: 'outreach_email',
      subject: { subjectType: 'lead', fields: { company: 'Lyfta', vertical: 'fitness' } },
      template: 'Escribe a {{company}}',
      extraInstructions: 'más corto',
      rules: 'NO em dashes',
    })
    expect(prompt).toContain('Lyfta')
    expect(prompt).toContain('Escribe a {{company}}')
    expect(prompt).toContain('más corto')
    expect(prompt).toContain('NO em dashes')
  })

  it('omite secciones vacías', () => {
    const prompt = buildPrompt({
      kind: 'cover_letter',
      subject: { subjectType: 'job', fields: { company: 'Stripe' } },
      template: 'X',
    })
    expect(prompt).not.toContain('Instrucciones extra')
    expect(prompt).not.toContain('Reglas de estilo')
  })
})
