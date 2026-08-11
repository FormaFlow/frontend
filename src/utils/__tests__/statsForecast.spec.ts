import {describe, expect, it} from 'vitest'
import {comparisonTone, forecastForToday} from '@/utils/statsForecast'

describe('statistics forecast', () => {
  it('projects the current value using elapsed minutes of the day', () => {
    expect(forecastForToday(60, new Date(2026, 7, 11, 12, 0))).toBe(120)
    expect(forecastForToday(10, new Date(2026, 7, 11, 6, 0))).toBe(40)
  })

  it('rounds a forecast down through a half and up only above a half', () => {
    const noon = new Date(2026, 7, 11, 12, 0)

    expect(forecastForToday(1.2, noon)).toBe(2)
    expect(forecastForToday(1.25, noon)).toBe(2)
    expect(forecastForToday(1.255, noon)).toBe(3)
    expect(forecastForToday(-1.25, noon)).toBe(-2)
    expect(forecastForToday(-1.255, noon)).toBe(-3)
  })

  it('does not divide by zero immediately after midnight', () => {
    expect(forecastForToday(0, new Date(2026, 7, 11, 0, 0))).toBe(0)
    expect(Number.isFinite(forecastForToday(1, new Date(2026, 7, 11, 0, 0)))).toBe(true)
  })

  it('uses the configured meaning of an increase for comparison colors', () => {
    expect(comparisonTone(20, 'increase_good')).toBe('positive')
    expect(comparisonTone(-20, 'increase_good')).toBe('negative')
    expect(comparisonTone(20, 'decrease_good')).toBe('negative')
    expect(comparisonTone(-20, 'decrease_good')).toBe('positive')
    expect(comparisonTone(20, 'neutral')).toBe('neutral')
    expect(comparisonTone(0, 'increase_good')).toBe('neutral')
  })
})
