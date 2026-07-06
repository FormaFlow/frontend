import {onMounted, onUnmounted, watch} from 'vue'
import {useAuthStore} from '@/stores/auth'
import {useEntriesStore} from '@/stores/entries'
import {useFormsStore} from '@/stores/forms'

const REFRESH_INTERVAL_MS = 30_000

export function useBackgroundRefresh() {
  const authStore = useAuthStore()
  const entriesStore = useEntriesStore()
  const formsStore = useFormsStore()
  let intervalId: number | null = null
  let refreshInFlight = false

  const canRefresh = () => {
    return authStore.isAuthenticated && navigator.onLine && document.visibilityState === 'visible'
  }

  const refresh = async () => {
    if (!canRefresh() || refreshInFlight) return

    refreshInFlight = true
    try {
      await entriesStore.syncPendingEntries()
      await Promise.all([
        formsStore.refreshCurrentForms(),
        entriesStore.refreshCurrentEntries()
      ])
    } finally {
      refreshInFlight = false
    }
  }

  const start = () => {
    if (intervalId !== null) return
    intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS)
  }

  const stop = () => {
    if (intervalId === null) return
    window.clearInterval(intervalId)
    intervalId = null
  }

  const handleOnline = () => {
    void refresh()
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void refresh()
    }
  }

  onMounted(() => {
    start()
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    stop()
    window.removeEventListener('online', handleOnline)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  watch(
    () => authStore.isAuthenticated,
    isAuthenticated => {
      if (isAuthenticated) {
        void refresh()
      }
    }
  )

  return {
    refresh,
    start,
    stop
  }
}
