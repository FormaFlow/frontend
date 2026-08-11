<template>
  <div data-testid="entry-stats-summary">
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
    <div v-else-if="rows.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
      {{ $t('reports.no_data') }}
    </div>

    <div v-else class="p-4">
      <div class="overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800/70">
        <div class="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
          <div class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            {{ currentTitle }}
          </div>
          <div class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            {{ secondaryTitle }}
          </div>
        </div>

        <div
          v-for="row in rows"
          :key="row.field"
          :class="[
            'grid grid-cols-2 divide-x divide-gray-200 border-t border-gray-200 dark:divide-gray-700 dark:border-gray-700',
            row.isCount && 'bg-gray-100/60 dark:bg-gray-900/20',
          ]"
        >
          <div :data-testid="`stats-current-${row.field}`" :class="rowCellClass(row.isCount)">
            <div :class="valueClass(row.isCount, 'neutral')">{{ row.current }}</div>
            <div class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{{ row.label }}</div>
          </div>
          <div :data-testid="`stats-secondary-${row.field}`" :class="rowCellClass(row.isCount)">
            <div class="flex flex-wrap items-center gap-1.5">
              <span :class="valueClass(row.isCount, row.secondaryIsDelta ? row.tone : 'neutral')">
                {{ row.secondary }}
              </span>
              <span
                v-if="row.comparison"
                :data-testid="`comparison-${row.field}`"
                :title="comparisonTitle"
                :class="comparisonClass(row.tone)"
              >
                {{ row.comparison }}
              </span>
            </div>
            <div class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{{ row.label }}</div>
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
import {
  comparisonTone,
  forecastForCurrentMonth,
  forecastForToday,
  type ComparisonTone,
} from '@/utils/statsForecast'
import type {EntryStats} from '@/api/entries'
import type {Form, FormField, FormFieldType, TrendDirection} from '@/types/form'

type PeriodMode = 'day' | 'month'

interface SummaryRow {
  field: string
  label: string
  current: string
  secondary: string
  comparison?: string
  tone: ComparisonTone
  secondaryIsDelta: boolean
  isCount: boolean
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
const previousMonthDate = computed(() => shiftMonthDate(monthDate.value, -1))
const {stats: dayStats, loading: dayLoading} = useStats(toRef(props, 'formId'), dayDate)
const {stats: monthStats, loading: monthLoading} = useStats(toRef(props, 'formId'), monthDate)
const {stats: previousMonthStats, loading: previousMonthLoading} = useStats(
  toRef(props, 'formId'),
  previousMonthDate,
)

const isToday = computed(() => dayDate.value === todayDate)
const isCurrentMonth = computed(() => monthDate.value.slice(0, 7) === currentMonth)
const isLatestPeriod = computed(() => mode.value === 'day' ? isToday.value : isCurrentMonth.value)
const activeLoading = computed(() => mode.value === 'day'
  ? dayLoading.value
  : monthLoading.value || previousMonthLoading.value)

const changePeriod = (offset: number) => {
  if (mode.value === 'day') {
    dayDate.value = addDaysToLocalDateString(dayDate.value, offset)
    return
  }
  monthDate.value = shiftMonthDate(monthDate.value, offset)
}

function shiftMonthDate(value: string, offset: number): string {
  const date = parseLocalDate(value)
  const originalDay = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + offset)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(originalDay, lastDay))
  return toLocalDateString(date)
}

const formatDate = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale.value, options).format(parseLocalDate(value))

const formattedNavigationMonth = computed(() =>
  formatDate(monthDate.value, {month: 'long', year: 'numeric'})
)

const currentTitle = computed(() => {
  if (mode.value === 'month') return formattedNavigationMonth.value
  if (isToday.value) return t('entries.today')
  return formatDate(dayDate.value, {day: 'numeric', month: 'short'})
})

const secondaryTitle = computed(() => {
  if (mode.value === 'day') {
    return isToday.value ? t('entries.forecast') : t('entries.previous_day_change')
  }
  return isCurrentMonth.value ? t('entries.forecast') : t('entries.previous_month_change')
})

const comparisonTitle = computed(() => mode.value === 'day'
  ? t('entries.compared_with_previous_day')
  : t('entries.compared_with_previous_month'))

const fieldMeta = (fieldId: string): {field: FormField | null, type: FormFieldType, direction: TrendDirection} => {
  if (fieldId === '_count') return {field: null, type: 'number', direction: 'neutral'}
  const field = props.form?.fields.find(item => item.id === fieldId) ?? null
  return {field, type: field?.type ?? 'number', direction: field?.trend_direction ?? 'neutral'}
}

const formatValue = (value: number, fieldId: string): string => {
  const {field, type} = fieldMeta(fieldId)
  return formatFieldValue(value, type, field?.unit)
}

const formatDelta = (delta: number, fieldId: string): string => {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '±'
  return `${sign}${formatValue(Math.abs(delta), fieldId)}`
}

const statsByField = (stats: EntryStats | null, key: 'sum_today' | 'sum_month') =>
  new Map((stats ?? []).map(stat => [stat.field, stat[key]]))

const orderedStats = (stats: EntryStats | null) => {
  const values = stats ?? []
  return [...values.filter(stat => stat.field !== '_count'), ...values.filter(stat => stat.field === '_count')]
}

const dayRows = computed<SummaryRow[]>(() => {
  if (!dayStats.value || !props.form) return []

  return orderedStats(dayStats.value).map(stat => {
    const {field, direction} = fieldMeta(stat.field)
    const isCount = stat.field === '_count'
    const secondaryValue = isToday.value ? forecastForToday(stat.sum_today) : stat.sum_today - stat.sum_previous_day
    const comparison = isToday.value ? secondaryValue - stat.sum_previous_day : null

    return {
      field: stat.field,
      label: field?.label ?? t('forms.entries_count'),
      current: formatValue(stat.sum_today, stat.field),
      secondary: isToday.value
        ? formatValue(secondaryValue, stat.field)
        : formatDelta(secondaryValue, stat.field),
      comparison: comparison === null ? undefined : formatDelta(comparison, stat.field),
      tone: comparisonTone(comparison ?? secondaryValue, direction),
      secondaryIsDelta: !isToday.value,
      isCount,
    }
  })
})

const monthRows = computed<SummaryRow[]>(() => {
  if (!monthStats.value || !props.form) return []

  const previous = statsByField(previousMonthStats.value, 'sum_month')
  return orderedStats(monthStats.value).map(stat => {
    const {field, direction} = fieldMeta(stat.field)
    const isCount = stat.field === '_count'
    const previousValue = previous.get(stat.field) ?? 0
    const secondaryValue = isCurrentMonth.value
      ? forecastForCurrentMonth(stat.sum_month)
      : stat.sum_month - previousValue
    const comparison = isCurrentMonth.value ? secondaryValue - previousValue : null

    return {
      field: stat.field,
      label: field?.label ?? t('forms.entries_count'),
      current: formatValue(stat.sum_month, stat.field),
      secondary: isCurrentMonth.value
        ? formatValue(secondaryValue, stat.field)
        : formatDelta(secondaryValue, stat.field),
      comparison: comparison === null ? undefined : formatDelta(comparison, stat.field),
      tone: comparisonTone(comparison ?? secondaryValue, direction),
      secondaryIsDelta: !isCurrentMonth.value,
      isCount,
    }
  })
})

const rows = computed(() => mode.value === 'day' ? dayRows.value : monthRows.value)

const periodButtonClass = (period: PeriodMode) => [
  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
  mode.value === period
    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
]

const rowCellClass = (isCount: boolean) => [
  'min-w-0 px-3',
  isCount ? 'py-2' : 'py-3',
]

const valueClass = (isCount: boolean, tone: ComparisonTone) => [
  isCount ? 'text-sm font-semibold' : 'text-xl font-bold sm:text-2xl',
  tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
  tone === 'negative' && 'text-red-600 dark:text-red-400',
  tone === 'neutral' && 'text-gray-900 dark:text-white',
]

const comparisonClass = (tone: ComparisonTone) => [
  'shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
  tone === 'positive' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
  tone === 'negative' && 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
  tone === 'neutral' && 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
]
</script>
