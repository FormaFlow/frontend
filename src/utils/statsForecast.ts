import type {TrendDirection} from '@/types/form'

export type ComparisonTone = 'positive' | 'negative' | 'neutral'

export function forecastForToday(value: number, now = new Date()): number {
  const elapsedMinutes = Math.max(1, now.getHours() * 60 + now.getMinutes())
  return Math.round((value * 1440 / elapsedMinutes) * 100) / 100
}

export function comparisonTone(delta: number, direction: TrendDirection): ComparisonTone {
  if (delta === 0 || direction === 'neutral') return 'neutral'

  const isPositive = direction === 'increase_good' ? delta > 0 : delta < 0
  return isPositive ? 'positive' : 'negative'
}
