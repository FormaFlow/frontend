<template>
  <div>
    <div v-if="formId" class="flex justify-end gap-1 border-b border-gray-200 p-3 dark:border-gray-700">
      <input
          v-model="statsDate"
          type="date"
          :max="todayDate"
          :aria-label="$t('entries.choose_stats_date')"
          class="form-input h-8 w-36 px-2 py-1 text-xs"
      />
      <button
          type="button"
          :aria-label="$t('common.previous')"
          :title="$t('common.previous')"
          class="rounded-md p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="changeDate(-1)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <button
          type="button"
          :aria-label="$t('common.next')"
          :title="$t('common.next')"
          class="rounded-md p-1 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700"
          :disabled="isToday"
          @click="changeDate(1)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <AppLoader />
    </div>

    <div v-else-if="!formId" class="py-8 text-center text-gray-500 dark:text-gray-400">
      {{ $t('reports.select_form_hint') }}
    </div>

    <div v-else-if="formattedStats.today.length === 0 && formattedStats.month.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
      {{ $t('reports.no_data') }}
    </div>

    <div v-else class="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-700 md:grid-cols-2 md:divide-x md:divide-y-0">
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">
            {{ isToday ? $t('entries.today') : formattedStatsDate }}
          </h3>
        </div>
        <div class="flex flex-wrap gap-x-8 gap-y-4">
          <div v-for="item in formattedStats.today" :key="item.label">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ item.value }}</div>
            <div class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <div class="p-6">
        <h3 class="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
          {{ isThisMonth ? $t('entries.this_month') : formattedStatsMonth }}
        </h3>
        <div class="flex flex-wrap gap-x-8 gap-y-4">
          <div v-for="item in formattedStats.month" :key="item.label">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ item.value }}</div>
            <div class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ item.label }}</div>
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
import type {Form} from '@/types/form'

const props = defineProps<{
  formId: string
  form: Form | null
}>()

const {t, locale} = useI18n()
const statsDate = ref(toLocalDateString())
const todayDate = toLocalDateString()
const {stats, loading} = useStats(toRef(props, 'formId'), statsDate)

const changeDate = (days: number) => {
  statsDate.value = addDaysToLocalDateString(statsDate.value, days)
}

const formattedStatsDate = computed(() =>
  new Intl.DateTimeFormat(locale.value, {day: 'numeric', month: 'long', year: 'numeric'})
    .format(parseLocalDate(statsDate.value))
)

const formattedStatsMonth = computed(() =>
  new Intl.DateTimeFormat(locale.value, {month: 'long', year: 'numeric'})
    .format(parseLocalDate(statsDate.value))
)

const isToday = computed(() => statsDate.value === toLocalDateString())
const isThisMonth = computed(() => {
  const now = new Date()
  const date = parseLocalDate(statsDate.value)
  return now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear()
})

const formattedStats = computed(() => {
  if (!stats.value || !props.form) return {today: [], month: []}

  const today: Array<{label: string, value: string | number}> = []
  const month: Array<{label: string, value: string | number}> = []

  stats.value.forEach(stat => {
    if (stat.field === '_count') {
      today.push({label: t('forms.entries_count'), value: stat.sum_today})
      month.push({label: t('forms.entries_count'), value: stat.sum_month})
      return
    }

    const field = props.form?.fields.find(item => item.id === stat.field)
    if (!field) return

    today.push({label: field.label, value: formatFieldValue(stat.sum_today, field.type, field.unit)})
    month.push({label: field.label, value: formatFieldValue(stat.sum_month, field.type, field.unit)})
  })

  return {today, month}
})
</script>
