<template>
  <div
      :class="[
        'card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700',
        opacityClass,
        'hover:opacity-100 transition-opacity duration-300 active:opacity-100 focus-within:opacity-100'
      ]"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <!-- Entry Data Fields -->
        <div v-if="fieldBadges.length > 0" class="mb-3 flex flex-wrap gap-2">
          <div
              v-for="badge in fieldBadges"
              :key="badge.id"
              class="inline-flex max-w-full items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-100"
          >
            <span class="font-medium text-gray-500 dark:text-gray-300">{{ badge.label }}:</span>
            <span class="truncate">{{ badge.value }}</span>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="entry.tags && entry.tags.length > 0" class="flex flex-wrap gap-2 mb-2">
          <span v-for="tag in entry.tags" :key="tag" class="badge badge-success text-xs">
            {{ tag }}
          </span>
        </div>

        <!-- Metadata -->
        <p class="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-1">
          <template v-if="showFormName && entry.form?.name">
            <span class="font-medium text-gray-600 dark:text-gray-300">{{ entry.form.name }}</span>
            <span class="text-gray-400">-</span>
          </template>
          <span>{{ $t('entries.created') }}:</span>
          <span>{{ formatDateTime(entry.created_at) }}</span>
          <span v-if="relativeCreatedAt" class="text-gray-400">({{ relativeCreatedAt }})</span>
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 ml-4 flex-shrink-0" v-if="showActions || showEditAction">
        <router-link
            :to="`/entries/${entry.id}/edit`"
            class="btn-secondary btn-sm p-2 flex items-center justify-center"
            :class="showActions ? 'sm:px-3 sm:py-1' : 'h-9 w-9'"
            :title="$t('common.edit')"
            :aria-label="$t('common.edit')"
        >
          <span v-if="showActions" class="hidden sm:inline">{{ $t('common.edit') }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" :class="{ 'sm:hidden': showActions }">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </router-link>
        <button v-if="showActions" type="button" class="btn-danger btn-sm p-2 sm:px-3 sm:py-1 flex items-center justify-center" @click="$emit('delete', entry.id)">
          <span class="hidden sm:inline">{{ $t('common.delete') }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 sm:hidden">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNowTicker } from '@/composables/useNowTicker'
import type { Entry } from '@/types/entry'
import type { FormField } from '@/types/form'
import { formatDateTime, formatRelativeTime } from '@/utils/helpers'
import { formatFieldValue } from '@/utils/formatters'

const props = defineProps<{
  entry: Entry
  formFields?: FormField[]
  showActions?: boolean
  showFormName?: boolean
  showEditAction?: boolean
}>()

defineEmits<{
  (e: 'delete', id: string): void
}>()

const { t } = useI18n()
const now = useNowTicker()

const fields = computed(() => {
  return props.entry.form?.fields || props.formFields || []
})

const fieldBadges = computed(() => {
  return fields.value
    .map(field => {
      const rawValue = props.entry.data[field.id]
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        return null
      }

      return {
        id: field.id,
        label: field.label,
        value: formatFieldValue(rawValue, field.type, field.unit)
      }
    })
    .filter((badge): badge is { id: string; label: string; value: string } => badge !== null)
})

const relativeCreatedAt = computed(() => {
  return formatRelativeTime(props.entry.created_at, t, now.value)
})

const opacityClass = computed(() => {
  const created = new Date(props.entry.created_at)
  const currentTime = new Date(now.value)

  // Start of today (00:00:00)
  const startOfToday = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
  if (created >= startOfToday) return 'opacity-100'

  // Start of this week (Monday)
  const dayOfWeek = currentTime.getDay() // 0 is Sunday
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const startOfThisWeek = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate() - diffToMonday)
  if (created >= startOfThisWeek) return 'opacity-75'

  // Start of this month
  const startOfThisMonth = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1)
  if (created >= startOfThisMonth) return 'opacity-60'

  return 'opacity-40'
})
</script>
