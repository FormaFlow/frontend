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
      <div v-for="entry in entries" :key="entry.id">
        <EntryCard 
          :entry="entry" 
          :form-fields="currentForm?.fields" 
          show-actions
          @delete="handleDelete" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import AppLoader from '@/components/common/AppLoader.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import EntryCard from '@/components/entries/EntryCard.vue'
import {useEntries} from '@/composables/useEntries'
import {useForms} from '@/composables/useForms'
import {useNotification} from '@/composables/useNotification'
import {useStats} from '@/composables/useStats'
import {debounce} from '@/utils/helpers'
import {formatFieldValue} from '@/utils/formatters'

const route = useRoute()
const {entries, loading, fetchEntries, deleteEntry} = useEntries()
const {forms, currentForm, fetchForms, fetchForm} = useForms()
const {showSuccess, showError} = useNotification()
// ... existing script continues ...

const searchQuery = ref('')
const selectedFormId = ref('')

const { stats, fetchStats } = useStats(selectedFormId)

const formOptions = computed(() =>
    forms.value.map(f => ({label: f.name, value: f.id}))
)

const todaySummary = computed(() => {
  if (!stats.value || !currentForm.value) return []
  return stats.value.map(stat => {
    const field = currentForm.value?.fields.find(f => f.id === stat.field)
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
    const field = currentForm.value?.fields.find(f => f.id === stat.field)
    return {
      fieldId: field?.id,
      label: field?.label,
      sum: stat.sum_month,
      type: field?.type || 'text', // Provide a default type
      unit: field?.unit
    }
  }).filter(s => s.sum > 0)
})

const handleSearch = debounce(async () => {
  await fetchEntries(1, selectedFormId.value || undefined)
}, 500)

const handleFormFilter = async (formId?: string) => {
  const targetFormId = formId ?? selectedFormId.value
  selectedFormId.value = targetFormId

  await fetchEntries(1, targetFormId || undefined)

  if (targetFormId) {
    await fetchForm(targetFormId)
    await fetchStats()
  } else {
    currentForm.value = null
  }
}

const handleDelete = async (id: string) => {
  if (confirm('Are you sure?')) {
    try {
      await deleteEntry(id)
      showSuccess('Entry deleted successfully')
      await fetchEntries(1, selectedFormId.value || undefined)
    } catch {
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
