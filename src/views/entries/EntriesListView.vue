<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-3xl font-bold">{{ $t('entries.title') }}</h1>
      <router-link to="/entries/create" class="btn-primary">
        + {{ $t('entries.create_entry') }}
      </router-link>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-col sm:flex-row gap-4">
        <input
            v-model="searchQuery"
            type="search"
            :placeholder="$t('common.search')"
            class="form-input flex-1"
            @input="handleSearch"
        />
        <AppSelect
            v-model="selectedFormId"
            :options="formOptions"
            :placeholder="$t('forms.title')"
            @update:modelValue="handleFormFilter"
        />
      </div>
    </div>

    <!-- Summary Card -->
    <div v-if="!loading && (todaySummary.length > 0 || monthSummary.length > 0)" class="card">
      <h3 class="text-lg font-semibold mb-4">{{ $t('entries.summary') }}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <!-- Today's Summary -->
        <div v-for="summary in todaySummary" :key="summary.fieldId" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ summary.label }} ({{ $t('entries.today') }})</p>
          <p class="text-2xl font-bold">{{ formatFieldValue(summary.sum, summary.type, summary.unit) }}</p>
        </div>
        <!-- This Month's Summary -->
        <div v-for="summary in monthSummary" :key="summary.fieldId" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ summary.label }} ({{ $t('entries.this_month') }})</p>
          <p class="text-2xl font-bold">{{ formatFieldValue(summary.sum, summary.type, summary.unit) }}</p>
        </div>
      </div>
    </div>

    <!-- Entries List -->
    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader/>
    </div>
    <div v-else-if="entries.length === 0" class="card text-center py-12">
      <p class="text-gray-600 dark:text-gray-400">{{ $t('entries.no_entries') }}</p>
    </div>
    <div v-else class="space-y-4">
      <div v-for="entry in entries" :key="entry.id" class="card">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Entry Data Fields -->
            <div v-if="currentForm" class="mb-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div v-for="field in currentForm.fields" :key="field.id" class="">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ field.label }}:</span>
                  <span class="ml-2 text-sm">{{ formatFieldValue(entry.data[field.name], field.type, field.unit) }}</span>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="entry.tags && entry.tags.length > 0" class="flex gap-2 mb-2">
              <span v-for="tag in entry.tags" :key="tag" class="badge badge-success">
                {{ tag }}
              </span>
            </div>

            <!-- Metadata -->
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('entries.created') }}: {{ formatDateTime(entry.created_at) }}
            </p>
          </div>
          <div class="flex gap-2">
            <router-link :to="`/entries/${entry.id}/edit`" class="btn-secondary btn-sm">
              {{ $t('common.edit') }}
            </router-link>
            <button type="button" class="btn-danger btn-sm" @click="handleDelete(entry.id)">
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import AppLoader from '@/components/common/AppLoader.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import {useEntries} from '@/composables/useEntries'
import {useForms} from '@/composables/useForms'
import {useNotification} from '@/composables/useNotification'
import {useStats} from '@/composables/useStats'
import {debounce, formatDateTime} from '@/utils/helpers'
import type {FormFieldType} from '@/types/form'

const route = useRoute()
const {entries, loading, fetchEntries, deleteEntry} = useEntries()
const {forms, currentForm, fetchForms, fetchForm} = useForms()
const {showSuccess, showError} = useNotification()

const searchQuery = ref('')
const selectedFormId = ref('')

const { stats, fetchStats } = useStats(selectedFormId)

const formOptions = computed(() =>
    forms.value.map(f => ({label: f.name, value: f.id}))
)

const todaySummary = computed(() => {
  if (!stats.value || !currentForm.value) return []
  return stats.value.map(stat => {
    const field = currentForm.value?.fields.find(f => f.name === stat.field)
    return {
      fieldId: field?.id,
      label: field?.label,
      sum: stat.sum_today,
      type: field?.type || 'text', // Provide a default type
      unit: field?.unit
    }
  }).filter(s => s.sum > 0)
})

const monthSummary = computed(() => {
  if (!stats.value || !currentForm.value) return []
  return stats.value.map(stat => {
    const field = currentForm.value?.fields.find(f => f.name === stat.field)
    return {
      fieldId: field?.id,
      label: field?.label,
      sum: stat.sum_month,
      type: field?.type || 'text', // Provide a default type
      unit: field?.unit
    }
  }).filter(s => s.sum > 0)
})

const formatFieldValue = (value: any, type: FormFieldType, unit?: string): string => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  switch (type) {
    case 'boolean':
      return value ? '✓' : '✗'
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'number':
      const num = typeof value === 'number' ? value : parseFloat(value)
      return isNaN(num) ? value : `${num.toLocaleString()}${unit ? ' ' + unit : ''}`
    case 'currency':
      const curr = typeof value === 'number' ? value : parseFloat(value)
      return isNaN(curr) ? value : `${curr.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})}${unit ? ' ' + unit : ''}`
    case 'email':
      return value
    case 'select':
      return value
    case 'text':
    default:
      return String(value)
  }
}

const handleSearch = debounce(async () => {
  await fetchEntries(1, selectedFormId.value || undefined)
}, 500)

const handleFormFilter = async () => {
  await fetchEntries(1, selectedFormId.value || undefined)

  if (selectedFormId.value) {
    await fetchForm(selectedFormId.value)
    await fetchStats()
  }
}

const handleDelete = async (id: string) => {
  if (confirm('Are you sure?')) {
    try {
      await deleteEntry(id)
      showSuccess('Entry deleted successfully')
      await fetchEntries(1, selectedFormId.value || undefined)
    } catch (error) {
      showError('Failed to delete entry')
    }
  }
}

watch(() => route.query.form_id, async (newFormId) => {
  if (newFormId && typeof newFormId === 'string') {
    selectedFormId.value = newFormId
    await fetchEntries(1, newFormId)
    await fetchForm(newFormId)
  }
}, { immediate: true })

onMounted(async () => {
  await fetchForms()

  const formId = route.query.form_id
  if (formId && typeof formId === 'string') {
    selectedFormId.value = formId
    await fetchEntries(1, formId)
    await fetchForm(formId)
    await fetchStats()
  } else {
    await fetchEntries()
    if (entries.value.length > 0) {
      await fetchForm(entries.value[0].form_id)
    }
  }
})

onUnmounted(() => {
  currentForm.value = null
})
</script>