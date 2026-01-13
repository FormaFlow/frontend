import { defineStore } from 'pinia'
import { ref } from 'vue'
import reportsApi, { type DashboardSummary, type TrendsData } from '@/api/reports'

export const useReportsStore = defineStore('reports', () => {
  const weekSummary = ref<DashboardSummary | null>(null)
  const monthSummary = ref<DashboardSummary | null>(null)
  const trends = ref<TrendsData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDashboardData = async () => {
    loading.value = true
    error.value = null
    try {
      const [weekRes, trendsRes] = await Promise.all([
        reportsApi.getDashboardWeek(),
        reportsApi.getDashboardTrends()
      ])
      
      weekSummary.value = weekRes
      trends.value = trendsRes
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    weekSummary,
    monthSummary,
    trends,
    loading,
    error,
    fetchDashboardData
  }
})