<template>
  <div>
    <div v-if="formId" class="space-y-2 border-b border-gray-200 p-3 dark:border-gray-700">
      <div class="mx-auto grid w-full max-w-sm grid-cols-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          data-testid="stats-day-tab"
          type="button"
          :aria-pressed="mode === 'day'"
          :class="periodButtonClass('day')"
          @click="mode = 'day'"
        >
          {{ $t('entries.day_view') }}
        </button>
        <button
          data-testid="stats-month-tab"
          type="button"
          :aria-pressed="mode === 'month'"
          :class="periodButtonClass('month')"
          @click="mode = 'month'"
        >
          {{ $t('entries.month_view') }}
        </button>
      </div>

      <div class="mx-auto grid w-full max-w-sm grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2">
        <button
          data-testid="stats-previous"
          type="button"
          :aria-label="$t('common.previous')"
          :title="$t('common.previous')"
          class="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="changePeriod(-1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <input
          v-if="mode === 'day'"
          v-model="dayDate"
          type="date"
          :max="todayDate"
          :aria-label="$t('entries.choose_stats_date')"
          class="form-input h-8 w-full min-w-0 px-2 py-1 text-xs"
        />
        <div
          v-else
          class="flex h-8 min-w-0 items-center justify-center text-sm font-medium capitalize text-gray-700 dark:text-gray-200"
        >
          {{ formattedNavigationMonth }}
        </div>

        <button
          data-testid="stats-next"
          type="button"
          :aria-label="$t('common.next')"
          :title="$t('common.next')"
          class="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700"
          :disabled="isLatestPeriod"
          @click="changePeriod(1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="activeLoading" class="flex justify-center py-8">
      <AppLoader />
    </div>

    <div v-else-if="!formId" class="py-8 text-center text-gray-500 dark:text-gray-400">
      {{ $t('reports.select_form_hint') }}
    </div>

    <div v-else-if="items.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
      {{ $t('reports.no_data') }}
    </div>

    <div v-else class="p-4">
      <h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
        {{ periodTitle }}
      </h3>
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in items"
          :key="item.field"
          class="min-w-0 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70"
        >
          <div v-if="item.isForecast" class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {{ $t('entries.forecast') }}
          </div>
          <div class="flex flex-wrap items-start gap-x-2 gap-y-1">
            <div
              class="min-w-0 whitespace-nowrap text-xl font-bold text-gray-900 dark:text-white sm:text-2xl"
              :data-testid="item.field === '_count' ? 'today-entry-count' : item.isForecast ? `forecast-${item.field}` : undefined"
            >
              {{ item.value }}
            </div>
            <span
              v-if="item.comparison"
              :data-testid="`comparison-${item.field}`"
              :title="$t('entries.compared_with_previous_day')"
              :class="['ml-auto', comparisonClass(item.tone)]"
            >
              {{ item.comparison }}
            </span>
          </div>
          <div class="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
            {{ item.label }}
          </div>
          <div v-if="item.currentValue" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ $t('entries.current_value') }}: {{ item.currentValue }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, toRef} from 'vue'
import {useI18n} from 'vue-i18n'
import AppLoader from '@/components/common/AppLoader.vue'
import {useStats} from '@/composables/useStats'
import {formatFieldValue} from '@/utils/formatters'
import {addDaysToLocalDateString, parseLocalDate, toLocalDateString} from '@/utils/date'
import {comparisonTone, forecastForToday, type ComparisonTone} from '@/utils/statsForecast'
import type {EntryStats} from '@/api/entries'
import type {Form, FormField, FormFieldType, TrendDirection} from '@/types/form'

type PeriodMode = 'day' | 'month'

interface StatsItem {
  field: string
  label: string
  value: string
  currentValue?: string
  comparison?: string
  tone: ComparisonTone
  isForecast: boolean
}

const props = defineProps<{
  formId: string
  form: Form | null
}>()

const {t, locale} = useI18n()
const todayDate = toLocalDateString()
const currentMonth = todayDate.slice(0, 7)
const mode = ref<PeriodMode>('day')
const dayDate = ref(todayDate)
const monthDate = ref(todayDate)
const {stats: dayStats, loading: dayLoading} = useStats(toRef(props, 'formId'), dayDate)
const {stats: monthStats, loading: monthLoading} = useStats(toRef(props, 'formId'), monthDate)

const activeLoading = computed(() => mode.value === 'day' ? dayLoading.value : monthLoading.value)
const isToday = computed(() => dayDate.value === todayDate)
const isLatestPeriod = computed(() => mode.value === 'day'
  ? isToday.value
  : monthDate.value.slice(0, 7) === currentMonth)

const changePeriod = (offset: number) => {
  if (mode.value === 'day') {
    dayDate.value = addDaysToLocalDateString(dayDate.value, offset)
    return
  }

  const date = parseLocalDate(monthDate.value)
  const originalDay = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + offset)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(originalDay, lastDay))
  monthDate.value = toLocalDateString(date)
}

const periodTitle = computed(() => {
  const date = parseLocalDate(mode.value === 'day' ? dayDate.value : monthDate.value)
  if (mode.value === 'month') {
    return new Intl.DateTimeFormat(locale.value, {month: 'long', year: 'numeric'}).format(date)
  }
  if (isToday.value) return t('entries.today')
  return new Intl.DateTimeFormat(locale.value, {day: 'numeric', month: 'long', year: 'numeric'}).format(date)
})

const formattedNavigationMonth = computed(() =>
  new Intl.DateTimeFormat(locale.value, {month: 'long', year: 'numeric'})
    .format(parseLocalDate(monthDate.value))
)

const fieldMeta = (fieldId: string): {field: FormField | null, type: FormFieldType, direction: TrendDirection} => {
  if (fieldId === '_count') return {field: null, type: 'number', direction: 'neutral'}
  const field = props.form?.fields.find(item => item.id === fieldId) ?? null
  return {field, type: field?.type ?? 'number', direction: field?.trend_direction ?? 'neutral'}
}

const formatValue = (value: number, fieldId: string): string => {
  const {field, type} = fieldMeta(fieldId)
  return formatFieldValue(value, type, field?.unit)
}

const formatComparison = (delta: number, fieldId: string): string => {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '±'
  return `${sign}${formatValue(Math.abs(delta), fieldId)}`
}

const dayItems = computed<StatsItem[]>(() => {
  if (!dayStats.value || !props.form) return []

  return dayStats.value.map(stat => {
    const {field, direction} = fieldMeta(stat.field)
    const forecast = isToday.value ? forecastForToday(stat.sum_today) : stat.sum_today
    const displayValue = stat.field === '_count' && isToday.value ? Math.round(forecast) : forecast
    const delta = displayValue - stat.sum_previous_day

    return {
      field: stat.field,
      label: field?.label ?? t('forms.entries_count'),
      value: formatValue(displayValue, stat.field),
      currentValue: isToday.value ? formatValue(stat.sum_today, stat.field) : undefined,
      comparison: formatComparison(delta, stat.field),
      tone: comparisonTone(delta, direction),
      isForecast: isToday.value,
    }
  })
})

const monthItems = computed<StatsItem[]>(() => formatMonthItems(monthStats.value))

function formatMonthItems(stats: EntryStats | null): StatsItem[] {
  if (!stats || !props.form) return []
  return stats.map(stat => {
    const {field} = fieldMeta(stat.field)
    return {
      field: stat.field,
      label: field?.label ?? t('forms.entries_count'),
      value: formatValue(stat.sum_month, stat.field),
      tone: 'neutral',
      isForecast: false,
    }
  })
}

const items = computed(() => mode.value === 'day' ? dayItems.value : monthItems.value)

const periodButtonClass = (period: PeriodMode) => [
  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
  mode.value === period
    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
]

const comparisonClass = (tone: ComparisonTone) => [
  'shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
  tone === 'positive' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
  tone === 'negative' && 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
  tone === 'neutral' && 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
]
</script>
