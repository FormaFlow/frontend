import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReportsStore } from '../reports'
import reportsApi from '@/api/reports'
import { db } from '@/db'

vi.mock('@/api/reports', () => ({
  default: {
    getDashboardWeek: vi.fn(),
    getDashboardTrends: vi.fn(),
  }
}))

describe('useReportsStore Offline', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    await db.cacheItems.clear()
  })

  it('falls back to cached dashboard data on network error', async () => {
    const store = useReportsStore()
    const week = { forms: [], total_entries: 4, summary_by_form: { f1: 4 } }
    const trends = { weekly_trends: [{ week: '2026-W25', count: 4 }], monthly_trends: [] }

    await db.setCacheItem('dashboard-week', week)
    await db.setCacheItem('dashboard-trends', trends)
    vi.mocked(reportsApi.getDashboardWeek).mockRejectedValue(new Error('Network Error'))
    vi.mocked(reportsApi.getDashboardTrends).mockRejectedValue(new Error('Network Error'))

    await store.fetchDashboardData()

    expect(store.weekSummary).toEqual(week)
    expect(store.trends).toEqual(trends)
    expect(store.error).toBeNull()
  })
})
