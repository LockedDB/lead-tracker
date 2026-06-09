import { describe, it, expect } from 'vitest'
import { isToday, isOverdue } from '@/lib/client/dates'

describe('dates', () => {
  const today = '2026-06-09'
  it('isToday', () => {
    expect(isToday('2026-06-09', today)).toBe(true)
    expect(isToday('2026-06-10', today)).toBe(false)
    expect(isToday(null, today)).toBe(false)
  })
  it('isOverdue', () => {
    expect(isOverdue('2026-06-08', today)).toBe(true)
    expect(isOverdue('2026-06-09', today)).toBe(false)
    expect(isOverdue('2026-06-10', today)).toBe(false)
    expect(isOverdue(null, today)).toBe(false)
  })
})
