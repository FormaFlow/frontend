<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-3xl font-bold">{{ $t('entries.title') }}</h1>
      <router-link :to="createEntryLink" class="btn-primary">
        + {{ $t('entries.create_entry') }}
      </router-link>
    </div>

    <!-- Filters -->
    <div class="card p-3 sm:p-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <input
            v-model="searchQuery"
            type="search"
            :placeholder="$t('common.search')"
            class="form-input flex-1"
            @input="handleSearch"
        />
        <FormSwitcher
            v-model="selectedFormId"
            :options="formOptions"
            :placeholder="$t('reports.custom.select_form')"
            compact-mobile
            @update:model-value="handleFormFilter"
        />
      </div>
    </div>

    <!-- Summary Card -->
    <div v-if="!loading && selectedFormId" class="card overflow-hidden p-0">
      <EntryStatsSummary :form-id="selectedFormId" :form="currentForm" />
    </div>

    <!-- Entries List -->
    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader/>
    </div>
    <div v-else-if="entries.length === 0" class="card text-center py-12">
      <p class="text-gray-600 dark:text-gray-400">{{ $t('entries.no_entries') }}</p>
    </div>
    <div v-else ref="entriesList" class="space-y-4">
      <div v-for="entry in entries" :key="entry.id" :data-entry-id="entry.id">
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
import {computed, onBeforeUpdate, onMounted, onUnmounted, onUpdated, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useIntersectionObserver} from '@vueuse/core'
import AppLoader from '@/components/common/AppLoader.vue'
import EntryCard from '@/components/entries/EntryCard.vue'
import EntryStatsSummary from '@/components/entries/EntryStatsSummary.vue'
import FormSwitcher from '@/components/entries/FormSwitcher.vue'
import {useEntries} from '@/composables/useEntries'
import {useForms} from '@/composables/useForms'
import {useNotification} from '@/composables/useNotification'
import {debounce} from '@/utils/helpers'

const route = useRoute()
const router = useRouter()
const {entries, loading, loadingMore, pagination, fetchEntries, deleteEntry} = useEntries()
const {forms, currentForm, fetchForms, fetchForm} = useForms()
const {showSuccess} = useNotification()

const { t } = useI18n()
const searchQuery = ref('')
const selectedFormId = ref('')
const loadMoreTrigger = ref<HTMLElement | null>(null)
const entriesList = ref<HTMLElement | null>(null)
let scrollAnchor: { id: string, top: number } | null = null

onBeforeUpdate(() => {
  if (!entriesList.value) {
    scrollAnchor = null
    return
  }

  const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
  const visibleEntry = Array.from(entriesList.value.querySelectorAll<HTMLElement>('[data-entry-id]'))
    .find(element => element.getBoundingClientRect().bottom > headerBottom)

  const id = visibleEntry?.dataset.entryId
  scrollAnchor = visibleEntry && id
    ? { id, top: visibleEntry.getBoundingClientRect().top }
    : null
})

onUpdated(() => {
  if (!entriesList.value || !scrollAnchor) return

  const anchor = scrollAnchor
  scrollAnchor = null
  const visibleEntry = Array.from(entriesList.value.querySelectorAll<HTMLElement>('[data-entry-id]'))
    .find(element => element.dataset.entryId === anchor.id)

  if (!visibleEntry) return

  const offset = visibleEntry.getBoundingClientRect().top - anchor.top
  if (Math.abs(offset) > 0.5) {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollBy(0, offset)
    document.documentElement.style.scrollBehavior = previousScrollBehavior
  }
})

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

const createEntryLink = computed(() => selectedFormId.value
  ? {name: 'entry-create', query: {form_id: selectedFormId.value}}
  : {name: 'entry-create'}
)

const handleSearch = debounce(async () => {
  await fetchEntries(1, selectedFormId.value || undefined)
}, 500)

const loadFormFilter = async (formId?: string) => {
  const targetFormId = formId ?? selectedFormId.value
  selectedFormId.value = targetFormId

  if (targetFormId) {
    localStorage.setItem('formaflow:last-quick-form-id', targetFormId)
    await Promise.all([
      fetchEntries(1, targetFormId),
      fetchForm(targetFormId)
    ])
  } else {
    currentForm.value = null
    await fetchEntries(1)
  }
}

const handleFormFilter = async (formId?: string) => {
  const currentFormId = typeof route.query.form_id === 'string' ? route.query.form_id : ''
  if ((formId || '') === currentFormId) {
    await loadFormFilter(formId)
    return
  }

  await router.replace({name: 'entries-list', query: formId ? {form_id: formId} : {}})
}

const handleDelete = async (id: string) => {
  if (confirm(t('common.confirm_delete'))) {
    try {
      await deleteEntry(id)
      showSuccess(t('entries.entry_deleted'))
      await fetchEntries(1, selectedFormId.value || undefined)
    } catch {
      // Error handled by composable
    }
  }
}

watch(() => route.query.form_id, async (newFormId) => {
  if (newFormId && typeof newFormId === 'string') {
    await loadFormFilter(newFormId)
  } else if (selectedFormId.value) {
    await loadFormFilter('')
  }
})

onMounted(async () => {
  await fetchForms(1, undefined, undefined, false)

  const formId = route.query.form_id
  if (formId && typeof formId === 'string') {
    await loadFormFilter(formId)
  } else {
    const rememberedFormId = localStorage.getItem('formaflow:last-quick-form-id')
    const initialFormId = forms.value.some(form => form.id === rememberedFormId)
      ? rememberedFormId
      : forms.value[0]?.id

    if (initialFormId) {
      await router.replace({name: 'entries-list', query: {form_id: initialFormId}})
    } else {
      await fetchEntries()
    }
  }
})

onUnmounted(() => {
  currentForm.value = null
})
</script>
