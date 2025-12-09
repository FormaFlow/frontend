import { ref, watch, type Ref } from 'vue'
import { entriesApi, type EntryStats } from '@/api/entries'

export function useStats(formId: Ref<string>) {
  const stats = ref<EntryStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStats() {
    if (!formId.value) {
      stats.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      stats.value = await entriesApi.stats(formId.value)
    } catch (e: any) {
      error.value = e.message
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
