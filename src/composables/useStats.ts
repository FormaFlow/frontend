import { ref, watch, type Ref } from 'vue'
import { entriesApi, type EntryStats, type WeeklyEntryStats } from '@/api/entries'
import { useUiStore } from '@/stores/ui'

const weeklyStatsCache = new Map<string, WeeklyEntryStats[]>()
const maxCachedWeeksPerForm = 8

function findCachedWeek(formId: string, date: string): WeeklyEntryStats | undefined {
  return weeklyStatsCache.get(formId)?.find(week => week.days.some(day => day.date === date))
}

function toEntryStats(response: WeeklyEntryStats, date: string): EntryStats {
  const dailyStats = response.days.find(day => day.date === date)?.stats ?? []
  const monthlyStats = response.months[date.slice(0, 7)] ?? []
  const monthlyByField = new Map(monthlyStats.map(stat => [stat.field, stat.sum_month]))

  return dailyStats.map(stat => ({
    field: stat.field,
    sum_today: stat.sum,
    sum_month: monthlyByField.get(stat.field) ?? 0
  }))
}

export function useStats(formId: Ref<string>, date?: Ref<string>) {
  const stats = ref<EntryStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const uiStore = useUiStore()

  const fetchStats = async (force = false) => {
    const targetDate = date?.value
    if (!formId.value || !targetDate) {
      stats.value = null
      return
    }

    const cached = force ? undefined : findCachedWeek(formId.value, targetDate)
    if (cached) {
      stats.value = toEntryStats(cached, targetDate)
      return
    }

    stats.value = null
    loading.value = true
    error.value = null
    try {
      const response = await entriesApi.weeklyStats(formId.value, targetDate)
      const weeks = weeklyStatsCache.get(formId.value) ?? []
      weeklyStatsCache.set(formId.value, [...weeks, response].slice(-maxCachedWeeksPerForm))
      stats.value = toEntryStats(response, targetDate)
    } catch (exception: unknown) {
      error.value = exception instanceof Error ? exception.message : String(exception)
      uiStore.handleApiError(exception, 'Failed to fetch stats')
    } finally {
      loading.value = false
    }
  }

  watch([formId, () => date?.value], () => {
    void fetchStats()
  }, { immediate: true })

  return {
    stats,
    loading,
    error,
    fetchStats,
  }
}
