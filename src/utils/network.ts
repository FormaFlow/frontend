export function isNetworkError(error: unknown): boolean {
  if (!navigator.onLine) return true
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return message.includes('network error') || message.includes('timeout') || message.includes('offline')
}

export function createLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
