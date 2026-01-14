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
    <div v-if="!loading && (formattedStats.today.length > 0 || formattedStats.month.length > 0)" class="card p-0 overflow-hidden">
      <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
        <!-- Today's Summary -->
        <div v-if="formattedStats.today.length > 0" class="p-6">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{{ $t('entries.today') }}</h3>
          <div class="flex flex-wrap gap-x-8 gap-y-4">
            <div v-for="(item, idx) in formattedStats.today" :key="idx">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ item.value }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ item.label }}</div>
            </div>
          </div>
        </div>

        <!-- This Month's Summary -->
        <div v-if="formattedStats.month.length > 0" class="p-6">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{{ $t('entries.this_month') }}</h3>
          <div class="flex flex-wrap gap-x-8 gap-y-4">
            <div v-for="(item, idx) in formattedStats.month" :key="idx">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ item.value }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ item.label }}</div>
            </div>
          </div>
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
      
      <!-- Infinite Scroll Trigger -->
      <div ref="loadMoreTrigger" class="h-10 flex justify-center items-center">
        <AppLoader v-if="loadingMore" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useIntersectionObserver} from '@vueuse/core'
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
const {entries, loading, loadingMore, pagination, fetchEntries, deleteEntry} = useEntries()
const {forms, currentForm, fetchForms, fetchForm} = useForms()
const {showSuccess, showError} = useNotification()

const { t } = useI18n()
const searchQuery = ref('')
const selectedFormId = ref('')
const loadMoreTrigger = ref<HTMLElement | null>(null)

const { stats, fetchStats } = useStats(selectedFormId)

// Load more logic
useIntersectionObserver(
  loadMoreTrigger,
  ([{isIntersecting}]) => {
    if (isIntersecting && !loading.value && !loadingMore.value && pagination.value.current_page < pagination.value.last_page) {
      loadMore()
    }
  },
  {
    rootMargin: '200px',
  }
)

const loadMore = async () => {
  await fetchEntries(pagination.value.current_page + 1, selectedFormId.value || undefined, undefined, true)
}

const formOptions = computed(() =>
    forms.value.map(f => ({label: f.name, value: f.id}))
)

const formattedStats = computed(() => {
  if (!stats.value || !currentForm.value) return { today: [], month: [] }

  const todayItems: { label: string, value: string | number }[] = []
  const monthItems: { label: string, value: string | number }[] = []

  // Find count stat
  const countStat = stats.value.find(s => s.field === '_count')
  const entriesLabel = t('forms.entries_count')

  if (countStat && countStat.sum_today > 0) {
    todayItems.push({ label: entriesLabel, value: countStat.sum_today })
  }
  if (countStat && countStat.sum_month > 0) {
    monthItems.push({ label: entriesLabel, value: countStat.sum_month })
  }

  // Process other fields
  stats.value.forEach(stat => {
    if (stat.field === '_count') return

    const field = currentForm.value?.fields.find(f => f.id === stat.field)
    if (!field) return

    const label = field.label

    if (stat.sum_today > 0) {
      const val = formatFieldValue(stat.sum_today, field.type, field.unit)
      todayItems.push({ label: label, value: val })
    }
    if (stat.sum_month > 0) {
      const val = formatFieldValue(stat.sum_month, field.type, field.unit)
      monthItems.push({ label: label, value: val })
    }
  })

  return { today: todayItems, month: monthItems }
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
