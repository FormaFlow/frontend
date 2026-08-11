import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount} from '@vue/test-utils'
import {createI18n} from 'vue-i18n'
import {createPinia, setActivePinia} from 'pinia'
import EntryStatsSummary from '../EntryStatsSummary.vue'
import {entriesApi} from '@/api/entries'
import ru from '@/locales/ru.json'
import type {Form} from '@/types/form'

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
    vi.mocked(entriesApi.weeklyStats).mockResolvedValue({
      days: [
        {date: '2026-08-11', stats: [{field: '_count', sum: 3}, {field: 'amount', sum: 60}]},
        {date: '2026-08-10', stats: [{field: '_count', sum: 4}, {field: 'amount', sum: 100}]},
        {date: '2026-08-09', stats: [{field: '_count', sum: 2}, {field: 'amount', sum: 140}]},
        {date: '2026-08-08', stats: [{field: '_count', sum: 0}, {field: 'amount', sum: 0}]},
        {date: '2026-08-07', stats: [{field: '_count', sum: 0}, {field: 'amount', sum: 0}]},
        {date: '2026-08-06', stats: [{field: '_count', sum: 0}, {field: 'amount', sum: 0}]},
        {date: '2026-08-05', stats: [{field: '_count', sum: 0}, {field: 'amount', sum: 0}]},
      ],
      months: {'2026-08': [{field: '_count', sum_month: 9}, {field: 'amount', sum_month: 240}]},
    })
  })

  afterEach(() => vi.useRealTimers())

  it('shows a today-only forecast and compares it with yesterday', async () => {
    const wrapper = mountSummary()
    await flushPromises()

    expect(wrapper.get('[data-testid="stats-day-tab"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="forecast-amount"]').text()).toContain('120 kg')
    const comparison = wrapper.get('[data-testid="comparison-amount"]')
    expect(comparison.text()).toContain('+20 kg')
    expect(comparison.classes()).toContain('text-emerald-600')

    await wrapper.get('[data-testid="stats-previous"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="forecast-amount"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="comparison-amount"]').text()).toContain('−40 kg')
    expect(wrapper.get('[data-testid="comparison-amount"]').classes()).toContain('text-red-600')
  })

  it('switches to a compact independently navigable month view', async () => {
    const wrapper = mountSummary()
    await flushPromises()

    await wrapper.get('[data-testid="stats-month-tab"]').trigger('click')
    expect(wrapper.get('[data-testid="stats-month-tab"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('240 kg')

    await wrapper.get('[data-testid="stats-previous"]').trigger('click')
    await flushPromises()

    expect(entriesApi.weeklyStats).toHaveBeenCalledWith('form-1', '2026-07-11')
  })
})
