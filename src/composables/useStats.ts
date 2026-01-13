import { ref, watch, type Ref } from 'vue'
import { entriesApi, type EntryStats } from '@/api/entries'

export function useStats(formId: Ref<string>) {
  const stats = ref<EntryStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchStats = async () => {
    if (!formIdRef.value) return
    loading.value = true
    try {
      const res = await entriesApi.stats(formIdRef.value)
      stats.value = res
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Failed to fetch stats')
    } finally {
      loading.value = false
    }
  }

  watch(formId, fetchStats, { immediate: true })

  return {
    stats,
    loading,
    error,
    fetchStats,
  }
}
