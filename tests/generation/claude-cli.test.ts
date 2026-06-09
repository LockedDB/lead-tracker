import { describe, it, expect } from 'vitest'
import { ClaudeCliGenerator } from '@/lib/generation/claude-cli'

describe('ClaudeCliGenerator', () => {
  it('pasa el prompt al runner y devuelve el contenido', async () => {
    let received = ''
    const gen = new ClaudeCliGenerator(async (prompt) => {
      received = prompt
      return '  texto generado  '
    })
    const result = await gen.generate({
      kind: 'outreach_email',
      subject: { subjectType: 'lead', fields: { company: 'Lyfta' } },
      template: 'Escribe a {{company}}',
    })
    expect(received).toContain('Lyfta')
    expect(result.content).toBe('texto generado')
    expect(result.generator).toBe('cli')
  })
})
