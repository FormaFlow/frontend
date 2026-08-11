import {getCurrentScope, onScopeDispose, ref, watch, type Ref} from 'vue'
import {entriesApi, type EntryStats, type WeeklyEntryStats} from '@/api/entries'
import {useUiStore} from '@/stores/ui'
import {subscribeToEntryChanges} from '@/utils/entryEvents'
import {addDaysToLocalDateString, toLocalDateString} from '@/utils/date'

const weeklyStatsCache = new Map<string, WeeklyEntryStats[]>()
const pendingWeeks = new Map<string, Promise<WeeklyEntryStats>>()
const maxCachedWeeksPerForm = 8

subscribeToEntryChanges(event => {
  weeklyStatsCache.delete(event.formId)
})

function findCachedWeek(formId: string, date: string): WeeklyEntryStats | undefined {
  return weeklyStatsCache.get(formId)?.find(week => {
    const index = week.days.findIndex(day => day.date === date)
    return index >= 0 && index < week.days.length - 1
  })
}

function storeWeek(formId: string, response: WeeklyEntryStats): void {
  const responseDates = new Set(response.days.map(day => day.date))
  const weeks = (weeklyStatsCache.get(formId) ?? [])
    .filter(week => !week.days.some(day => responseDates.has(day.date)))
  weeklyStatsCache.set(formId, [...weeks, response].slice(-maxCachedWeeksPerForm))
}

async function fetchWeek(formId: string, date: string): Promise<WeeklyEntryStats> {
  const key = `${formId}:${date}`
  const pending = pendingWeeks.get(key)
  if (pending) return pending

  const request = entriesApi.weeklyStats(formId, date)
    .then(response => {
      storeWeek(formId, response)
      return response
    })
    .finally(() => pendingWeeks.delete(key))

  pendingWeeks.set(key, request)
  return request
}

function toEntryStats(response: WeeklyEntryStats, date: string): EntryStats {
  const dailyStats = response.days.find(day => day.date === date)?.stats ?? []
  const previousDate = addDaysToLocalDateString(date, -1)
  const previousStats = response.days.find(day => day.date === previousDate)?.stats ?? []
  const previousByField = new Map(previousStats.map(stat => [stat.field, stat.sum]))
  const monthlyStats = response.months[date.slice(0, 7)] ?? []
  const monthlyByField = new Map(monthlyStats.map(stat => [stat.field, stat.sum_month]))

  return dailyStats.map(stat => ({
    field: stat.field,
    sum_today: stat.sum,
    sum_previous_day: previousByField.get(stat.field) ?? 0,
    sum_month: monthlyByField.get(stat.field) ?? 0
  }))
}

function prefetchAdjacentWeeks(formId: string, response: WeeklyEntryStats, date: string): void {
  const selectedIndex = response.days.findIndex(day => day.date === date)
  if (selectedIndex < 2 || selectedIndex > 4 || response.days.length === 0) return

  const newestDate = response.days[0].date
  const oldestDate = response.days[response.days.length - 1].date
  const olderAnchor = addDaysToLocalDateString(oldestDate, -1)
  const newerAnchor = addDaysToLocalDateString(newestDate, 7)

  if (!findCachedWeek(formId, olderAnchor)) {
    void fetchWeek(formId, olderAnchor).catch(() => undefined)
  }
  if (newerAnchor <= toLocalDateString() && !findCachedWeek(formId, newerAnchor)) {
    void fetchWeek(formId, newerAnchor).catch(() => undefined)
  }
}

export function useStats(formId: Ref<string>, date?: Ref<string>) {
  const stats = ref<EntryStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const uiStore = useUiStore()

  const fetchStats = async (force = false) => {
    const selectedFormId = formId.value
    const targetDate = date?.value
    if (!selectedFormId || !targetDate) {
      stats.value = null
      return
    }

    if (force) weeklyStatsCache.delete(selectedFormId)
    const cached = findCachedWeek(selectedFormId, targetDate)
    if (cached) {
      stats.value = toEntryStats(cached, targetDate)
      prefetchAdjacentWeeks(selectedFormId, cached, targetDate)
      return
    }

    stats.value = null
    loading.value = true
    error.value = null
    try {
      const response = await fetchWeek(selectedFormId, targetDate)
      if (selectedFormId !== formId.value || targetDate !== date?.value) return

      stats.value = toEntryStats(response, targetDate)
      prefetchAdjacentWeeks(selectedFormId, response, targetDate)
    } catch (exception: unknown) {
      error.value = exception instanceof Error ? exception.message : String(exception)
      uiStore.handleApiError(exception, 'Failed to fetch stats')
    } finally {
      loading.value = false
    }
  }

  watch([formId, () => date?.value], () => {
    void fetchStats()
  }, {immediate: true})

  const unsubscribe = subscribeToEntryChanges(event => {
    if (event.formId === formId.value) void fetchStats(true)
  })
  if (getCurrentScope()) onScopeDispose(unsubscribe)

  return {
    stats,
    loading,
    error,
    fetchStats,
  }
}
