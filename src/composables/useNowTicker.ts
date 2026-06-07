import { ref } from 'vue'

const TICK_INTERVAL_MS = 30_000
const now = ref(Date.now())
let timeoutId: number | null = null

function startTicker(): void {
  if (timeoutId !== null || typeof window === 'undefined') {
    return
  }

  const tick = () => {
    now.value = Date.now()
    timeoutId = window.setTimeout(tick, TICK_INTERVAL_MS)
  }

  timeoutId = window.setTimeout(tick, TICK_INTERVAL_MS)
}

export function useNowTicker() {
  startTicker()
  return now
}
