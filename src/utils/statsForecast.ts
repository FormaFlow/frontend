import type {TrendDirection} from '@/types/form'

export type ComparisonTone = 'positive' | 'negative' | 'neutral'

function roundHalfDown(value: number): number {
  const sign = value < 0 ? -1 : 1
  const absolute = Math.abs(value)
  const lower = Math.floor(absolute)
  return sign * (absolute - lower > 0.5 ? lower + 1 : lower)
}

export function forecastForToday(value: number, now = new Date(), history: number[] = []): number {
  const elapsedMinutes = Math.max(1, now.getHours() * 60 + now.getMinutes())
  return forecastWithHistory(value, elapsedMinutes / 1440, history)
}

export function forecastForCurrentMonth(value: number, now = new Date(), history: number[] = []): number {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const elapsedMs = Math.max(60_000, now.getTime() - monthStart.getTime())
  const monthDurationMs = nextMonthStart.getTime() - monthStart.getTime()
  return forecastWithHistory(value, elapsedMs / monthDurationMs, history)
}

export function forecastWithHistory(value: number, elapsedFraction: number, history: number[]): number {
  const progress = Math.min(1, Math.max(Number.EPSILON, elapsedFraction))
  if (history.length === 0) return roundHalfDown(value / progress)

  let weight = 1
  let weightedTotal = 0
  let totalWeight = 0
  for (const historicalValue of history) {
    weightedTotal += historicalValue * weight
    totalWeight += weight
    weight *= 0.75
  }

  const historicalBaseline = weightedTotal / totalWeight
  const forecast = value + historicalBaseline * (1 - progress)
  return roundHalfDown(value >= 0 ? Math.max(value, forecast) : Math.min(value, forecast))
}

export function comparisonTone(delta: number, direction: TrendDirection): ComparisonTone {
  if (delta === 0 || direction === 'neutral') return 'neutral'

  const isPositive = direction === 'increase_good' ? delta > 0 : delta < 0
  return isPositive ? 'positive' : 'negative'
}
