import { defineStore } from 'pinia'
import { ref } from 'vue'
import reportsApi, { type DashboardSummary, type TrendsData } from '@/api/reports'
import { db } from '@/db'
import { isNetworkError } from '@/utils/network'

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
      await Promise.all([
        db.setCacheItem('dashboard-week', weekRes),
        db.setCacheItem('dashboard-trends', trendsRes)
      ])
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        const [cachedWeek, cachedTrends] = await Promise.all([
          db.getCacheItem<DashboardSummary>('dashboard-week'),
          db.getCacheItem<TrendsData>('dashboard-trends')
        ])

        weekSummary.value = cachedWeek
        trends.value = cachedTrends
        return
      }

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
