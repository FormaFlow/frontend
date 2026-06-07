export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (date: string | Date, locale = 'en-CA'): string => {
  const d = new Date(date)
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export const formatRelativeTime = (
  date: string | Date,
  t: (key: string, values?: Record<string, unknown>) => string,
  nowTimestamp: number = Date.now()
): string | null => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) {
    return null
  }

  const diffInSeconds = Math.floor((nowTimestamp - d.getTime()) / 1000)
  const safeDiffInSeconds = diffInSeconds < 0 ? 0 : diffInSeconds

  if (safeDiffInSeconds < 5) {
    return t('time.just_now')
  }

  if (safeDiffInSeconds < 60) {
    return t('time.seconds_ago', { count: safeDiffInSeconds })
  }

  const diffInMinutes = Math.floor(safeDiffInSeconds / 60)
  if (diffInMinutes < 60) {
    return t('time.minutes_ago', { count: diffInMinutes })
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    const remainingMinutes = diffInMinutes % 60
    if (remainingMinutes > 0) {
      return t('time.hours_minutes_ago', {
        hours: diffInHours,
        minutes: remainingMinutes
      })
    }

    return t('time.hours_ago', { count: diffInHours })
  }

  return null
}

export const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(value)
}

export const truncate = (text: string, length: number = 50): string => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}
