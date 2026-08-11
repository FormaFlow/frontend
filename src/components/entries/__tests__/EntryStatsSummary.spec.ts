import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount} from '@vue/test-utils'
import {createI18n} from 'vue-i18n'
import {createPinia, setActivePinia} from 'pinia'
import EntryStatsSummary from '../EntryStatsSummary.vue'
import {entriesApi} from '@/api/entries'
import ru from '@/locales/ru.json'
import type {Form} from '@/types/form'
import {publishEntryChange} from '@/utils/entryEvents'

vi.mock('@/api/entries', () => ({
  entriesApi: {weeklyStats: vi.fn()}
}))

const form = {
  id: 'form-1',
  name: 'Usage',
  published: true,
  is_quiz: false,
  single_submission: false,
  quick_entry_favorite: false,
  fields_count: 1,
  fields: [{
    id: 'amount',
    label: 'Amount',
    type: 'number',
    unit: 'kg',
    trend_direction: 'increase_good',
    required: false,
    order: 0,
  }],
} satisfies Form

function mountSummary() {
  return mount(EntryStatsSummary, {
    props: {formId: form.id, form},
    global: {
      plugins: [createPinia(), createI18n({legacy: false, locale: 'ru', messages: {ru}})],
      stubs: {AppLoader: true},
    },
  })
}

describe('EntryStatsSummary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 11, 12, 0))
    setActivePinia(createPinia())
    publishEntryChange('form-1')
    vi.mocked(entriesApi.weeklyStats).mockImplementation(async (_formId, date) => {
      const month = date?.slice(0, 7)
      if (month === '2026-07') return monthlyResponse('2026-07-11', 12, 650)
      if (month === '2026-06') return monthlyResponse('2026-06-11', 10, 700)

      return {
        days: [
          {date: '2026-08-11', stats: [{field: '_count', sum: 3}, {field: 'amount', sum: 60.25}]},
          {date: '2026-08-10', stats: [{field: '_count', sum: 4}, {field: 'amount', sum: 100}]},
          {date: '2026-08-09', stats: [{field: '_count', sum: 2}, {field: 'amount', sum: 140}]},
          {date: '2026-08-08', stats: [{field: '_count', sum: 0}, {field: 'amount', sum: 0}]},
          {date: '2026-08-07', stats: [{field: '_count', sum: 0}, {field: 'amount', sum: 0}]},
          {date: '2026-08-06', stats: [{field: '_count', sum: 0}, {field: 'amount', sum: 0}]},
          {date: '2026-08-05', stats: [{field: '_count', sum: 0}, {field: 'amount', sum: 0}]},
        ],
        months: {'2026-08': [{field: '_count', sum_month: 9}, {field: 'amount', sum_month: 240}]},
      }
    })
  })

  afterEach(() => vi.useRealTimers())

  it('shows current and forecast columns for today, including entry counts', async () => {
    const wrapper = mountSummary()
    await flushPromises()

    expect(wrapper.get('[data-testid="stats-day-tab"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="stats-current-amount"]').text()).toContain('60.25 kg')
    expect(wrapper.get('[data-testid="stats-secondary-amount"]').text()).toContain('120 kg')
    expect(wrapper.get('[data-testid="stats-current-_count"]').text()).toContain('3')
    expect(wrapper.get('[data-testid="stats-secondary-_count"]').text()).toContain('6')
    const comparison = wrapper.get('[data-testid="comparison-amount"]')
    expect(comparison.text()).toContain('+20 kg')
    expect(comparison.classes()).toContain('text-emerald-600')

    expect(wrapper.get('[data-testid="comparison-_count"]').text()).toContain('+2')
  })

  it('forecasts the current month and compares a completed month with its predecessor', async () => {
    const wrapper = mountSummary()
    await flushPromises()

    await wrapper.get('[data-testid="stats-month-tab"]').trigger('click')
    expect(wrapper.get('[data-testid="stats-month-tab"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="stats-current-amount"]').text()).toContain('240 kg')
    expect(wrapper.get('[data-testid="stats-secondary-amount"]').text()).toContain('709 kg')
    expect(wrapper.get('[data-testid="stats-current-_count"]').text()).toContain('9')
    expect(wrapper.get('[data-testid="stats-secondary-_count"]').text()).toContain('27')
    expect(wrapper.get('[data-testid="comparison-amount"]').text()).toContain('+59 kg')
    expect(wrapper.get('[data-testid="comparison-_count"]').text()).toContain('+15')

    await wrapper.get('[data-testid="stats-previous"]').trigger('click')
    await flushPromises()

    expect(entriesApi.weeklyStats).toHaveBeenCalledWith('form-1', '2026-06-11')
    expect(wrapper.get('[data-testid="stats-current-amount"]').text()).toContain('650 kg')
    expect(wrapper.get('[data-testid="stats-secondary-amount"]').text()).toContain('−50 kg')
    expect(wrapper.get('[data-testid="stats-current-_count"]').text()).toContain('12')
    expect(wrapper.get('[data-testid="stats-secondary-_count"]').text()).toContain('+2')
  })
})

function monthlyResponse(anchor: string, count: number, amount: number) {
  const month = anchor.slice(0, 7)
  return {
    days: Array.from({length: 7}, (_, index) => ({
      date: `${month}-${String(11 - index).padStart(2, '0')}`,
      stats: [{field: '_count', sum: 0}, {field: 'amount', sum: 0}],
    })),
    months: {[month]: [{field: '_count', sum_month: count}, {field: 'amount', sum_month: amount}]},
  }
}
