import { beforeEach, describe, expect, it, vi } from 'vitest'
import {effectScope, ref} from 'vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { entriesApi } from '@/api/entries'
import { useStats } from '@/composables/useStats'
import {publishEntryChange} from '@/utils/entryEvents'

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

    await flushPromises()
    expect(entriesApi.weeklyStats).toHaveBeenCalledTimes(1)
    expect(stats.value?.[0]).toEqual({ field: '_count', sum_today: 0, sum_month: 3 })

    date.value = '2026-07-23'
    await flushPromises()

    expect(entriesApi.weeklyStats).toHaveBeenCalledTimes(1)
    expect(stats.value?.[0]).toEqual({ field: '_count', sum_today: 2, sum_month: 3 })
  })

  it('prefetches the older week before the user reaches the cache boundary', async () => {
    const formId = ref('form-prefetch')
    const date = ref('2026-07-24')
    useStats(formId, date)

    await flushPromises()

    date.value = '2026-07-21'
    await flushPromises()

    expect(entriesApi.weeklyStats).toHaveBeenCalledWith('form-prefetch', '2026-07-17')
  })

  it('invalidates cached statistics when another tab creates an entry', async () => {
    const formId = ref('form-live')
    const date = ref('2026-07-24')
    const refreshedResponse = {
      ...weeklyResponse,
      days: weeklyResponse.days.map(day => day.date === '2026-07-24'
        ? {date: day.date, stats: [{field: '_count', sum: 1}]}
        : day)
    }
    vi.mocked(entriesApi.weeklyStats)
      .mockResolvedValueOnce(weeklyResponse)
      .mockResolvedValueOnce(refreshedResponse)

    const {stats} = useStats(formId, date)
    await flushPromises()

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'formaflow:entry-change',
      newValue: JSON.stringify({formId: 'form-live', changedAt: Date.now()})
    }))
    await flushPromises()

    expect(entriesApi.weeklyStats).toHaveBeenCalledTimes(2)
    expect(stats.value?.[0].sum_today).toBe(1)
  })

  it('invalidates cached statistics while the stats widget is unmounted', async () => {
    const formId = ref('form-edited-away-from-stats')
    const date = ref('2026-07-24')
    const firstScope = effectScope()
    firstScope.run(() => useStats(formId, date))
    await flushPromises()
    firstScope.stop()

    publishEntryChange(formId.value)

    const secondScope = effectScope()
    secondScope.run(() => useStats(formId, date))
    await flushPromises()
    secondScope.stop()

    expect(entriesApi.weeklyStats).toHaveBeenCalledTimes(2)
  })
})
