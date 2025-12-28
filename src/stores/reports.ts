import { defineStore } from 'pinia'
import reportsApi, { type DashboardSummary, type TrendsData } from '@/api/reports'

export const useReportsStore = defineStore('reports', {
  state: () => ({
    weekSummary: null as DashboardSummary | null,
    monthSummary: null as DashboardSummary | null,
    trends: null as TrendsData | null,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchDashboardData() {
      this.loading = true
      this.error = null
      try {
        const [week, month, trends] = await Promise.all([
          reportsApi.getDashboardWeek(),
          reportsApi.getDashboardMonth(),
          reportsApi.getDashboardTrends()
        ])
        this.weekSummary = week
        this.monthSummary = month
        this.trends = trends
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch dashboard data'
        console.error(err)
      } finally {
        this.loading = false
      }
    }
  }
})
