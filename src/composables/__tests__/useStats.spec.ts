import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { entriesApi } from '@/api/entries'
import { useStats } from '@/composables/useStats'

vi.mock('@/api/entries', () => ({
  entriesApi: {
    weeklyStats: vi.fn()
  }
}))

const weeklyResponse = {
  days: [
    { date: '2026-07-24', stats: [{ field: '_count', sum: 0 }] },
    { date: '2026-07-23', stats: [{ field: '_count', sum: 2 }] },
    { date: '2026-07-22', stats: [{ field: '_count', sum: 1 }] },
    { date: '2026-07-21', stats: [{ field: '_count', sum: 0 }] },
    { date: '2026-07-20', stats: [{ field: '_count', sum: 0 }] },
    { date: '2026-07-19', stats: [{ field: '_count', sum: 0 }] },
    { date: '2026-07-18', stats: [{ field: '_count', sum: 0 }] }
  ],
  months: {
    '2026-07': [{ field: '_count', sum_month: 3 }]
  }
}

describe('useStats', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(entriesApi.weeklyStats).mockResolvedValue(weeklyResponse)
  })

  it('uses the loaded week when navigating to an adjacent day', async () => {
    const formId = ref('form-1')
    const date = ref('2026-07-24')
    const { stats } = useStats(formId, date)

    await nextTick()
    await nextTick()
    expect(entriesApi.weeklyStats).toHaveBeenCalledTimes(1)
    expect(stats.value?.[0]).toEqual({ field: '_count', sum_today: 0, sum_month: 3 })

    date.value = '2026-07-23'
    await nextTick()
    await nextTick()

    expect(entriesApi.weeklyStats).toHaveBeenCalledTimes(1)
    expect(stats.value?.[0]).toEqual({ field: '_count', sum_today: 2, sum_month: 3 })
  })
})
