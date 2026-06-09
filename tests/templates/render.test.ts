import { describe, it, expect } from 'vitest'
import { renderTemplate } from '@/lib/templates/render'

describe('renderTemplate', () => {
  it('sustituye placeholders', () => {
    const out = renderTemplate('Hola {{company}}, rol {{role}}', {
      company: 'Lyfta',
      role: 'iOS',
    })
    expect(out).toBe('Hola Lyfta, rol iOS')
  })

  it('placeholder sin valor queda vacío', () => {
    expect(renderTemplate('X {{missing}} Y', {})).toBe('X  Y')
  })
})
