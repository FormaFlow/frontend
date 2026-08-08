<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold">{{ $t('payments.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ dateRangeLabel }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn-secondary" type="button" @click="showPlans = !showPlans">
          {{ $t(showPlans ? 'payments.hide_plans' : 'payments.show_plans') }}
        </button>
        <button class="btn-primary" type="button" @click="openCreatePlan">
          + {{ $t('payments.new_plan') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard :label="$t('payments.overdue')" :value="String(summary.overdue_count)" tone="danger" />
      <SummaryCard :label="$t('payments.due_soon')" :value="String(summary.due_soon_count)" tone="warning" />
      <SummaryCard :label="$t('payments.expected_month')" :value="money(summary.expected_this_month)" />
      <SummaryCard :label="$t('payments.paid_month')" :value="money(summary.paid_this_month)" tone="success" />
    </div>

    <div class="card p-4">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select v-model="filters.status" class="form-select" aria-label="Payment status">
          <option value="">{{ $t('payments.all_statuses') }}</option>
          <option value="overdue">{{ $t('payments.overdue') }}</option>
          <option value="planned">{{ $t('payments.planned') }}</option>
          <option value="paid">{{ $t('payments.paid') }}</option>
          <option value="cancelled">{{ $t('payments.cancelled') }}</option>
        </select>
        <select v-model="filters.categoryId" class="form-select" aria-label="Payment category" @change="loadData()">
          <option value="">{{ $t('payments.all_categories') }}</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <input v-model="filters.from" type="date" class="form-input" aria-label="From date" @change="loadData()" />
        <input v-model="filters.to" type="date" class="form-input" aria-label="To date" @change="loadData()" />
      </div>
    </div>

    <section v-if="showPlans" class="card space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">{{ $t('payments.plans') }}</h2>
        <span class="text-sm text-gray-500">{{ plans.length }}</span>
      </div>
      <div v-if="plans.length" class="grid gap-3 lg:grid-cols-2">
        <article v-for="plan in plans" :key="plan.id" class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-semibold">{{ plan.name }}</h3>
                <span :class="plan.status === 'active' ? 'badge badge-success' : 'badge'">
                  {{ $t(`payments.${plan.status}`) }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-500">
                {{ plan.category?.name || '—' }}<span v-if="plan.payee"> · {{ plan.payee }}</span>
              </p>
              <p class="mt-2 text-sm">
                {{ $t('payments.progress', {paid: plan.paid_count || 0, total: plan.occurrences_count || 0}) }}
              </p>
            </div>
            <div class="text-right font-medium">
              {{ money(plan.default_expected_amount || plan.default_nominal_amount) }}
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <button class="btn-secondary btn-sm" type="button" @click="openEditPlan(plan)">
              {{ $t('common.edit') }}
            </button>
            <button v-if="plan.status === 'active'" class="btn-secondary btn-sm" type="button" @click="openClosePlan(plan)">
              {{ $t('payments.close_early') }}
            </button>
            <button v-if="!plan.paid_count" class="btn-danger btn-sm" type="button" @click="removePlan(plan)">
              {{ $t('common.delete') }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader />
    </div>
    <div v-else-if="displayedOccurrences.length === 0" class="card py-12 text-center text-gray-500">
      {{ $t('payments.no_payments') }}
    </div>
    <div v-else class="space-y-3" data-testid="payments-list">
      <div
        v-if="displayedOverdueCount"
        class="rounded-lg border border-red-300 bg-red-50 px-4 py-3 font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
        data-testid="overdue-alert"
      >
        {{ $t('payments.overdue_notice', {count: displayedOverdueCount}) }}
      </div>
      <article
        v-for="occurrence in displayedOccurrences"
        :key="occurrence.id"
        class="card p-4"
        :class="isOverdue(occurrence) && 'border border-red-400 border-l-4 border-l-red-500 bg-red-50 dark:border-red-800 dark:bg-red-950/20'"
        :data-occurrence-id="occurrence.id"
        :data-overdue="isOverdue(occurrence) ? 'true' : undefined"
        data-testid="payment-occurrence"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 gap-4">
            <div class="w-16 shrink-0 text-center">
              <div class="text-2xl font-bold">{{ day(occurrence.due_on) }}</div>
              <div class="text-xs uppercase text-gray-500">{{ month(occurrence.due_on) }}</div>
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="truncate font-semibold">{{ occurrence.plan.name }}</h2>
                <span :class="statusClass(occurrence)">{{ statusLabel(occurrence) }}</span>
              </div>
              <p class="text-sm text-gray-500">
                {{ occurrence.plan.category?.name || '—' }}
                <span v-if="occurrence.sequence_no"> · {{ occurrence.sequence_no }} / {{ occurrence.total_count }}</span>
              </p>
              <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span v-if="occurrence.nominal_amount" class="text-gray-500">
                  {{ $t('payments.nominal_short') }}: {{ money(occurrence.nominal_amount) }}
                </span>
                <span v-if="occurrence.expected_amount">
                  {{ $t('payments.expected_short') }}: {{ money(occurrence.expected_amount) }}
                </span>
                <span v-if="occurrence.actual_amount" class="font-medium text-green-600 dark:text-green-400">
                  {{ $t('payments.actual_short') }}: {{ money(occurrence.actual_amount) }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 gap-2 sm:justify-end">
            <button v-if="occurrence.status === 'planned'" class="btn-primary btn-sm" type="button" @click="openPay(occurrence)">
              {{ $t('payments.pay') }}
            </button>
            <button v-if="occurrence.status === 'paid' && occurrence.kind !== 'settlement'" class="btn-secondary btn-sm" type="button" @click="reopenPayment(occurrence)">
              {{ $t('payments.reopen') }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <AppModal
      :is-open="planModalOpen"
      :title="$t(editingPlanId ? 'payments.edit_plan' : 'payments.new_plan')"
      :confirm-text="$t('common.save')"
      max-width="max-w-3xl"
      @close="planModalOpen = false"
      @confirm="savePlan"
    >
      <div class="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput v-model="planForm.name" :label="$t('payments.name')" required />
          <AppInput v-model="planForm.payee" :label="$t('payments.payee')" />
          <AppSelect v-model="planForm.category_id" :label="$t('payments.category')" :options="categoryOptions" />
          <AppInput v-if="!planForm.category_id" v-model="planForm.new_category" :label="$t('payments.new_category')" />
          <AppSelect v-model="planForm.type" :label="$t('payments.plan_type')" :options="planTypeOptions" required @update:model-value="setPlanType" />
          <AppSelect v-model="planForm.schedule_type" :label="$t('payments.schedule_type')" :options="scheduleOptions" required />
          <AppInput v-model="planForm.starts_on" type="date" :label="$t('payments.starts_on')" />
          <AppInput v-if="planForm.schedule_type === 'monthly'" v-model="planForm.day_of_month" type="number" :label="$t('payments.day_of_month')" />
          <AppInput v-if="planForm.schedule_type === 'interval'" v-model="planForm.interval_days" type="number" :label="$t('payments.interval_days')" />
          <AppInput v-if="planForm.schedule_type === 'interval'" v-model="planForm.total_installments" type="number" :label="$t('payments.total_installments')" />
          <AppInput v-model="planForm.default_nominal_amount" type="number" :label="$t('payments.nominal_amount')" />
          <AppInput v-model="planForm.default_expected_amount" type="number" :label="$t('payments.expected_amount')" />
          <AppInput v-model="planForm.fee_percent" type="number" :label="$t('payments.fee_percent')" />
          <AppInput v-model="planForm.fee_fixed" type="number" :label="$t('payments.fee_fixed')" />
        </div>

        <div v-if="planForm.schedule_type === 'manual' && !editingPlanId" class="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h4 class="font-medium">{{ $t('payments.manual') }}</h4>
            <button class="btn-secondary btn-sm" type="button" @click="addManualOccurrence">
              + {{ $t('payments.add_occurrence') }}
            </button>
          </div>
          <div v-for="(item, index) in planForm.occurrences" :key="index" class="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-900 sm:grid-cols-5">
            <input v-model="item.due_on" type="date" class="form-input" :aria-label="$t('payments.due_on')" />
            <input v-model="item.sequence_no" type="number" min="1" class="form-input" placeholder="#" />
            <input v-model="item.total_count" type="number" min="1" class="form-input" placeholder="Σ" />
            <input v-model="item.nominal_amount" type="number" step="0.01" class="form-input" :placeholder="$t('payments.nominal_short')" />
            <div class="flex gap-2">
              <input v-model="item.expected_amount" type="number" step="0.01" class="form-input" :placeholder="$t('payments.expected_short')" />
              <button v-if="planForm.occurrences.length > 1" type="button" class="text-red-500" @click="planForm.occurrences.splice(index, 1)">×</button>
            </div>
          </div>
        </div>

        <div>
          <label class="form-label">{{ $t('payments.notes') }}</label>
          <textarea v-model="planForm.notes" class="form-textarea" rows="2"></textarea>
        </div>
      </div>
    </AppModal>

    <AppModal
      :is-open="payModalOpen"
      :title="$t('payments.pay')"
      :confirm-text="$t('payments.pay')"
      @close="payModalOpen = false"
      @confirm="confirmPay"
    >
      <div class="space-y-4">
        <AppInput v-model="paymentForm.actual_amount" type="number" :label="$t('payments.payment_amount')" required />
        <AppInput v-model="paymentForm.paid_at" type="datetime-local" :label="$t('payments.payment_date')" required />
      </div>
    </AppModal>

    <AppModal
      :is-open="closeModalOpen"
      :title="$t('payments.close_early')"
      :confirm-text="$t('payments.close_early')"
      @close="closeModalOpen = false"
      @confirm="confirmClosePlan"
    >
      <div class="space-y-4">
        <AppInput v-model="closeForm.actual_amount" type="number" :label="$t('payments.settlement_amount')" required />
        <AppInput v-model="closeForm.paid_at" type="datetime-local" :label="$t('payments.payment_date')" required />
        <div>
          <label class="form-label">{{ $t('payments.settlement_note') }}</label>
          <textarea v-model="closeForm.notes" class="form-textarea" rows="2"></textarea>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import {computed, defineComponent, h, onMounted, reactive, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import AppModal from '@/components/common/AppModal.vue'
import {paymentsApi} from '@/api/payments'
import {useNotification} from '@/composables/useNotification'
import type {
  PaymentCategory,
  PaymentOccurrence,
  PaymentOccurrenceInput,
  PaymentPlan,
  PaymentPlanInput,
  PaymentSummary
} from '@/types/payment'

const SummaryCard = defineComponent({
  props: {label: {type: String, required: true}, value: {type: String, required: true}, tone: {type: String, default: ''}},
  setup(props) {
    return () => h('div', {
      class: ['card p-4', props.tone === 'danger' && 'border-l-4 border-red-500', props.tone === 'warning' && 'border-l-4 border-yellow-500', props.tone === 'success' && 'border-l-4 border-green-500']
    }, [h('p', {class: 'text-xs text-gray-500 sm:text-sm'}, props.label), h('p', {class: 'mt-1 text-lg font-bold sm:text-2xl'}, props.value)])
  }
})

type EditableOccurrence = PaymentOccurrenceInput & {
  sequence_no: number | null
  total_count: number | null
  nominal_amount: string
  expected_amount: string
}

type EditablePlan = Omit<PaymentPlanInput,
  'occurrences' | 'category_id' | 'payee' | 'starts_on' | 'day_of_month' | 'interval_days' |
  'total_installments' | 'default_nominal_amount' | 'default_expected_amount' | 'fee_percent' |
  'fee_fixed' | 'notes'> & {
  category_id: string
  new_category: string
  payee: string
  starts_on: string
  day_of_month: number | string
  interval_days: number | string
  total_installments: number | string
  default_nominal_amount: string
  default_expected_amount: string
  fee_percent: string
  fee_fixed: string
  notes: string
  occurrences: EditableOccurrence[]
}

const {t, locale} = useI18n()
const {showSuccess, showError} = useNotification()
const loading = ref(false)
const categories = ref<PaymentCategory[]>([])
const plans = ref<PaymentPlan[]>([])
const occurrences = ref<PaymentOccurrence[]>([])
const showPlans = ref(false)
const summary = reactive<PaymentSummary>({overdue_count: 0, due_soon_count: 0, expected_this_month: '0.00', paid_this_month: '0.00'})
const today = new Date()
const dateInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
const localDateTime = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const filters = reactive({
  status: 'planned',
  categoryId: '',
  from: dateInput(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())),
  to: dateInput(new Date(today.getFullYear(), today.getMonth() + 4, today.getDate()))
})

const emptyOccurrence = (): EditableOccurrence => ({due_on: '', sequence_no: null, total_count: null, nominal_amount: '', expected_amount: ''})
const emptyPlan = (): EditablePlan => ({
  category_id: '', new_category: '', name: '', payee: '', type: 'recurring', currency: 'RUB', schedule_type: 'monthly',
  starts_on: dateInput(today), ends_on: null, day_of_month: today.getDate(), interval_days: 14, total_installments: '',
  default_nominal_amount: '', default_expected_amount: '', fee_percent: '0', fee_fixed: '0', notes: '', occurrences: [emptyOccurrence()]
})
const planForm = ref<EditablePlan>(emptyPlan())
const planModalOpen = ref(false)
const editingPlanId = ref<string | null>(null)
const payModalOpen = ref(false)
const payingOccurrence = ref<PaymentOccurrence | null>(null)
const paymentForm = reactive({actual_amount: '', paid_at: localDateTime()})
const closeModalOpen = ref(false)
const closingPlan = ref<PaymentPlan | null>(null)
const closeForm = reactive({actual_amount: '', paid_at: localDateTime(), notes: ''})

const categoryOptions = computed(() => categories.value.map(category => ({label: category.name, value: category.id})))
const planTypeOptions = computed(() => [
  {label: t('payments.one_off'), value: 'one_off'},
  {label: t('payments.recurring'), value: 'recurring'},
  {label: t('payments.installment'), value: 'installment'}
])
const scheduleOptions = computed(() => [
  {label: t('payments.one_off'), value: 'one_off'},
  {label: t('payments.monthly'), value: 'monthly'},
  {label: t('payments.interval'), value: 'interval'},
  {label: t('payments.manual'), value: 'manual'}
])
const dateRangeLabel = computed(() => `${formatDate(filters.from)} — ${formatDate(filters.to)}`)
const displayedOccurrences = computed(() => occurrences.value
  .filter(occurrence => {
    if (!filters.status) return true
    if (filters.status === 'overdue') return isOverdue(occurrence)
    return occurrence.status === filters.status
  })
  .sort((left, right) => {
    const overdueOrder = Number(isOverdue(right)) - Number(isOverdue(left))
    return overdueOrder || left.due_on.localeCompare(right.due_on) || left.id.localeCompare(right.id)
  }))
const displayedOverdueCount = computed(() => displayedOccurrences.value.filter(isOverdue).length)

const loadData = async (showLoader = true) => {
  if (showLoader) loading.value = true
  try {
    const params: Record<string, unknown> = {from: filters.from, to: filters.to}
    if (filters.categoryId) params.category_id = filters.categoryId
    const [overview, categoryResponse, planResponse] = await Promise.all([
      paymentsApi.overview(params), paymentsApi.categories(), paymentsApi.plans()
    ])
    Object.assign(summary, overview.summary)
    occurrences.value = overview.occurrences
    categories.value = categoryResponse.categories
    plans.value = planResponse.plans
  } catch (error) {
    showError(error instanceof Error ? error.message : t('common.error'))
  } finally {
    if (showLoader) loading.value = false
  }
}

const openCreatePlan = () => {
  editingPlanId.value = null
  planForm.value = emptyPlan()
  planModalOpen.value = true
}

const openEditPlan = (plan: PaymentPlan) => {
  editingPlanId.value = plan.id
  planForm.value = {
    ...emptyPlan(),
    category_id: plan.category_id || '',
    name: plan.name,
    payee: plan.payee || '',
    type: plan.type,
    currency: plan.currency,
    schedule_type: plan.schedule_type,
    starts_on: plan.starts_on || dateInput(today),
    day_of_month: plan.day_of_month || '',
    interval_days: plan.interval_days || '',
    total_installments: plan.total_installments || '',
    default_nominal_amount: plan.default_nominal_amount || '',
    default_expected_amount: plan.default_expected_amount || '',
    fee_percent: plan.fee_percent || '0',
    fee_fixed: plan.fee_fixed || '0',
    notes: plan.notes || ''
  }
  planModalOpen.value = true
}

const setPlanType = (type: string) => {
  if (type === 'one_off') planForm.value.schedule_type = 'one_off'
  if (type === 'recurring') planForm.value.schedule_type = 'monthly'
  if (type === 'installment') planForm.value.schedule_type = 'manual'
}

const addManualOccurrence = () => planForm.value.occurrences.push(emptyOccurrence())

const cleanNumber = (value: unknown): number | null => value === '' || value === null || value === undefined ? null : Number(value)
const cleanMoney = (value: unknown): string | null => value === '' || value === null || value === undefined ? null : String(value)

const savePlan = async () => {
  if (!planForm.value.name.trim()) return
  try {
    let categoryId = planForm.value.category_id || null
    if (!categoryId && planForm.value.new_category.trim()) {
      const category = await paymentsApi.createCategory({name: planForm.value.new_category.trim()})
      categoryId = category.id
    }
    const payload: PaymentPlanInput = {
      category_id: categoryId,
      name: planForm.value.name.trim(),
      payee: planForm.value.payee.trim() || null,
      type: planForm.value.type,
      currency: planForm.value.currency,
      schedule_type: planForm.value.schedule_type,
      starts_on: planForm.value.starts_on || null,
      day_of_month: cleanNumber(planForm.value.day_of_month),
      interval_days: cleanNumber(planForm.value.interval_days),
      total_installments: cleanNumber(planForm.value.total_installments),
      default_nominal_amount: cleanMoney(planForm.value.default_nominal_amount),
      default_expected_amount: cleanMoney(planForm.value.default_expected_amount),
      fee_percent: cleanMoney(planForm.value.fee_percent),
      fee_fixed: cleanMoney(planForm.value.fee_fixed),
      notes: planForm.value.notes.trim() || null
    }
    if (!editingPlanId.value && payload.schedule_type === 'manual') {
      payload.occurrences = planForm.value.occurrences.filter(item => item.due_on).map(item => ({
        due_on: item.due_on,
        sequence_no: cleanNumber(item.sequence_no),
        total_count: cleanNumber(item.total_count),
        nominal_amount: cleanMoney(item.nominal_amount),
        expected_amount: cleanMoney(item.expected_amount)
      }))
    }
    if (editingPlanId.value) {
      payload.effective_from = dateInput(today)
      await paymentsApi.updatePlan(editingPlanId.value, payload)
    } else {
      await paymentsApi.createPlan(payload)
    }
    planModalOpen.value = false
    showSuccess(t('payments.saved'))
    await loadData(false)
  } catch (error) {
    showError(error instanceof Error ? error.message : t('common.error'))
  }
}

const removePlan = async (plan: PaymentPlan) => {
  if (!confirm(t('common.confirm_delete'))) return
  try {
    await paymentsApi.deletePlan(plan.id)
    showSuccess(t('payments.deleted'))
    await loadData(false)
  } catch (error) {
    showError(error instanceof Error ? error.message : t('common.error'))
  }
}

const openPay = (occurrence: PaymentOccurrence) => {
  payingOccurrence.value = occurrence
  paymentForm.actual_amount = occurrence.expected_amount || occurrence.nominal_amount || ''
  paymentForm.paid_at = localDateTime()
  payModalOpen.value = true
}

const confirmPay = async () => {
  if (!payingOccurrence.value || !paymentForm.actual_amount) return
  try {
    const updated = await paymentsApi.pay(payingOccurrence.value.id, {...paymentForm})
    applyOccurrenceUpdate(updated)
    payModalOpen.value = false
    payingOccurrence.value = null
    showSuccess(t('payments.marked_paid'))
  } catch (error) {
    showError(error instanceof Error ? error.message : t('common.error'))
  }
}

const reopenPayment = async (occurrence: PaymentOccurrence) => {
  try {
    const updated = await paymentsApi.reopen(occurrence.id)
    applyOccurrenceUpdate(updated)
    showSuccess(t('payments.reopened'))
  } catch (error) {
    showError(error instanceof Error ? error.message : t('common.error'))
  }
}

const openClosePlan = (plan: PaymentPlan) => {
  closingPlan.value = plan
  closeForm.actual_amount = plan.default_expected_amount || plan.default_nominal_amount || ''
  closeForm.paid_at = localDateTime()
  closeForm.notes = ''
  closeModalOpen.value = true
}

const confirmClosePlan = async () => {
  if (!closingPlan.value || !closeForm.actual_amount) return
  try {
    await paymentsApi.closePlan(closingPlan.value.id, {...closeForm})
    closeModalOpen.value = false
    showSuccess(t('payments.closed_success'))
    await loadData(false)
  } catch (error) {
    showError(error instanceof Error ? error.message : t('common.error'))
  }
}

const parseDate = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`)
const formatDate = (value: string) => new Intl.DateTimeFormat(locale.value, {day: '2-digit', month: 'short', year: 'numeric'}).format(parseDate(value))
const day = (value: string) => new Intl.DateTimeFormat(locale.value, {day: '2-digit'}).format(parseDate(value))
const month = (value: string) => new Intl.DateTimeFormat(locale.value, {month: 'short'}).format(parseDate(value))
const money = (value?: string | null) => new Intl.NumberFormat(locale.value, {style: 'currency', currency: 'RUB', maximumFractionDigits: 2}).format(Number(value || 0))
const isOverdue = (occurrence: PaymentOccurrence) => occurrence.status === 'planned' && occurrence.due_on.slice(0, 10) < dateInput(today)
const dueSoonThrough = dateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7))
const isDueSoon = (occurrence: PaymentOccurrence) => occurrence.status === 'planned' &&
  occurrence.due_on.slice(0, 10) >= dateInput(today) && occurrence.due_on.slice(0, 10) <= dueSoonThrough
const isCurrentMonth = (value?: string | null) => value?.slice(0, 7) === dateInput(today).slice(0, 7)
const occurrenceContribution = (occurrence: PaymentOccurrence) => ({
  overdue: isOverdue(occurrence) ? 1 : 0,
  dueSoon: isDueSoon(occurrence) ? 1 : 0,
  expected: occurrence.status === 'planned' && isCurrentMonth(occurrence.due_on)
    ? Number(occurrence.expected_amount || 0)
    : 0,
  paid: occurrence.status === 'paid' && isCurrentMonth(occurrence.paid_at)
    ? Number(occurrence.actual_amount || 0)
    : 0
})
const applyOccurrenceUpdate = (updated: PaymentOccurrence) => {
  const index = occurrences.value.findIndex(item => item.id === updated.id)
  if (index < 0) return

  const previous = occurrences.value[index]
  const next = {...updated, plan: updated.plan || previous.plan}
  const before = occurrenceContribution(previous)
  const after = occurrenceContribution(next)

  occurrences.value.splice(index, 1, next)
  summary.overdue_count = Math.max(0, summary.overdue_count - before.overdue + after.overdue)
  summary.due_soon_count = Math.max(0, summary.due_soon_count - before.dueSoon + after.dueSoon)
  summary.expected_this_month = Math.max(
    0,
    Number(summary.expected_this_month) - before.expected + after.expected
  ).toFixed(2)
  summary.paid_this_month = Math.max(
    0,
    Number(summary.paid_this_month) - before.paid + after.paid
  ).toFixed(2)

  if (previous.status !== next.status) {
    plans.value = plans.value.map(plan => plan.id === next.plan_id ? {
      ...plan,
      planned_count: Math.max(
        0,
        (plan.planned_count || 0) - Number(previous.status === 'planned') + Number(next.status === 'planned')
      ),
      paid_count: Math.max(
        0,
        (plan.paid_count || 0) - Number(previous.status === 'paid') + Number(next.status === 'paid')
      )
    } : plan)
  }
}
const statusLabel = (occurrence: PaymentOccurrence) => t(isOverdue(occurrence) ? 'payments.overdue' : `payments.${occurrence.status}`)
const statusClass = (occurrence: PaymentOccurrence) => [
  'badge',
  occurrence.status === 'paid' && 'badge-success',
  (occurrence.status === 'cancelled' || isOverdue(occurrence)) && 'badge-danger',
  occurrence.status === 'planned' && !isOverdue(occurrence) && 'badge-warning'
]

onMounted(loadData)
</script>
