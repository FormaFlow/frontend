import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount} from '@vue/test-utils'
import {createI18n} from 'vue-i18n'
import {createPinia, setActivePinia} from 'pinia'
import PaymentsView from '@/views/PaymentsView.vue'
import {paymentsApi} from '@/api/payments'
import ru from '@/locales/ru.json'
import type {PaymentOccurrence, PaymentPlan} from '@/types/payment'

vi.mock('@/api/payments', () => ({
  paymentsApi: {
    overview: vi.fn(),
    categories: vi.fn(),
    plans: vi.fn(),
    createCategory: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn(),
    pay: vi.fn(),
    reopen: vi.fn(),
    closePlan: vi.fn()
  }
}))

const plan: PaymentPlan = {
  id: 'plan-1',
  category_id: 'category-1',
  category: {id: 'category-1', name: 'Кредиты'},
  name: 'Greenmoney',
  payee: 'Greenmoney',
  type: 'installment',
  status: 'active',
  currency: 'RUB',
  schedule_type: 'manual',
  default_nominal_amount: '7774.73',
  default_expected_amount: '9000.00',
  fee_percent: '0.0000',
  fee_fixed: '0.00',
  paid_count: 2,
  planned_count: 10,
  occurrences_count: 12
}

const occurrence: PaymentOccurrence = {
  id: 'occurrence-1',
  plan_id: plan.id,
  plan,
  due_on: '2026-08-15',
  sequence_no: 3,
  total_count: 12,
  kind: 'scheduled',
  nominal_amount: '7774.73',
  expected_amount: '9000.00',
  actual_amount: null,
  status: 'planned',
  paid_at: null
}

const makeOccurrence = (overrides: Partial<PaymentOccurrence>): PaymentOccurrence => ({
  ...occurrence,
  ...overrides,
  plan: {...plan, ...overrides.plan}
})

function mountView() {
  const i18n = createI18n({legacy: false, locale: 'ru', fallbackLocale: 'ru', messages: {ru}})
  return mount(PaymentsView, {
    global: {
      plugins: [createPinia(), i18n],
      stubs: {Teleport: true, AppLoader: true}
    }
  })
}

describe('PaymentsView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T12:00:00+03:00'))
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(paymentsApi.overview).mockResolvedValue({
      summary: {overdue_count: 1, due_soon_count: 2, expected_this_month: '9000.00', paid_this_month: '18000.00'},
      occurrences: [occurrence]
    })
    vi.mocked(paymentsApi.categories).mockResolvedValue({categories: [plan.category!]})
    vi.mocked(paymentsApi.plans).mockResolvedValue({plans: [plan]})
    vi.mocked(paymentsApi.pay).mockResolvedValue({
      ...occurrence,
      status: 'paid',
      actual_amount: '9000.00',
      paid_at: '2026-08-08T12:00:00+03:00'
    })
  })

  afterEach(() => vi.useRealTimers())

  it('shows payment summary and the three amount layers', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Greenmoney')
    expect(wrapper.text()).toContain('7 774,73')
    expect(wrapper.text()).toContain('9 000')
    expect(wrapper.text()).toContain('Просрочено')
    expect(paymentsApi.overview).toHaveBeenCalledOnce()
  })

  it('marks a planned occurrence as paid with the expected amount by default', async () => {
    const wrapper = mountView()
    await flushPromises()

    const payButton = wrapper.findAll('button').find(button => button.text() === 'Оплатить')
    expect(payButton).toBeDefined()
    await payButton!.trigger('click')
    await flushPromises()

    const modalButtons = wrapper.findAll('button').filter(button => button.text() === 'Оплатить')
    await modalButtons.at(-1)!.trigger('click')
    await flushPromises()

    expect(paymentsApi.pay).toHaveBeenCalledWith('occurrence-1', expect.objectContaining({actual_amount: '9000.00'}))
    expect(paymentsApi.overview).toHaveBeenCalledOnce()
    expect(wrapper.find('[data-occurrence-id="occurrence-1"]').exists()).toBe(false)
    expect(wrapper.find('app-loader-stub').exists()).toBe(false)
  })

  it('opens with planned payments and puts overdue occurrences first', async () => {
    vi.mocked(paymentsApi.overview).mockResolvedValue({
      summary: {overdue_count: 1, due_soon_count: 1, expected_this_month: '1500.00', paid_this_month: '500.00'},
      occurrences: [
        makeOccurrence({id: 'future', due_on: '2026-08-10', expected_amount: '500.00'}),
        makeOccurrence({
          id: 'paid',
          due_on: '2026-08-01',
          status: 'paid',
          actual_amount: '500.00',
          paid_at: '2026-08-01T12:00:00+03:00'
        }),
        makeOccurrence({id: 'overdue', due_on: '2026-08-07', expected_amount: '1000.00'})
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    const status = wrapper.get<HTMLSelectElement>('select[aria-label="Payment status"]')
    expect(status.element.value).toBe('planned')

    const rows = wrapper.findAll('[data-testid="payment-occurrence"]')
    expect(rows.map(row => row.attributes('data-occurrence-id'))).toEqual(['overdue', 'future'])
    expect(rows[0].attributes('data-overdue')).toBe('true')
    expect(rows[0].classes()).toContain('bg-red-50')
    expect(wrapper.get('[data-testid="overdue-alert"]').text()).toContain('Просроченные платежи: 1')
  })
})
