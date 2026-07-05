import { describe, expect, it } from 'vitest'
import { addDaysToLocalDateString, parseLocalDate, toLocalDateString } from '../date'

describe('local date helpers', () => {
  it('formats a date using local calendar fields', () => {
    expect(toLocalDateString(new Date(2026, 6, 6, 1, 18))).toBe('2026-07-06')
  })

  it('parses YYYY-MM-DD as a local date', () => {
    const date = parseLocalDate('2026-07-06')

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(6)
    expect(date.getDate()).toBe(6)
  })

  it('adds days without UTC conversion', () => {
    expect(addDaysToLocalDateString('2026-07-06', -1)).toBe('2026-07-05')
    expect(addDaysToLocalDateString('2026-07-31', 1)).toBe('2026-08-01')
  })
})
