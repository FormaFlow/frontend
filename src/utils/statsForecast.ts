import type {TrendDirection} from '@/types/form'

export type ComparisonTone = 'positive' | 'negative' | 'neutral'

function roundHalfDown(value: number): number {
  const sign = value < 0 ? -1 : 1
  const absolute = Math.abs(value)
  const lower = Math.floor(absolute)
  return sign * (absolute - lower > 0.5 ? lower + 1 : lower)
}

export function forecastForToday(value: number, now = new Date()): number {
  const elapsedMinutes = Math.max(1, now.getHours() * 60 + now.getMinutes())
  return roundHalfDown(value * 1440 / elapsedMinutes)
}

export function forecastForCurrentMonth(value: number, now = new Date()): number {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const elapsedMs = Math.max(60_000, now.getTime() - monthStart.getTime())
  const monthDurationMs = nextMonthStart.getTime() - monthStart.getTime()
  return roundHalfDown(value * monthDurationMs / elapsedMs)
}

export function comparisonTone(delta: number, direction: TrendDirection): ComparisonTone {
  if (delta === 0 || direction === 'neutral') return 'neutral'

  const isPositive = direction === 'increase_good' ? delta > 0 : delta < 0
  return isPositive ? 'positive' : 'negative'
}
