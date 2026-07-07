<template>
  <div class="card bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 quick-entry-widget">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 class="text-xl font-bold">{{ $t('entries.create_entry') }}</h2>
      <div class="flex w-full items-center gap-2 sm:w-auto">
        <button
            type="button"
            class="btn-secondary flex h-10 w-10 shrink-0 items-center justify-center p-0"
            :disabled="formOptions.length <= 1"
            :title="$t('common.previous')"
            :aria-label="$t('common.previous')"
            @click="selectAdjacentForm(-1)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <AppSelect
          v-model="selectedFormId"
          :options="formOptions"
          :placeholder="$t('reports.custom.select_form')"
          class="min-w-0 flex-1 sm:w-64"
          @update:modelValue="handleFormSelect"
        />
        <button
            type="button"
            class="btn-secondary flex h-10 w-10 shrink-0 items-center justify-center p-0"
            :disabled="formOptions.length <= 1"
            :title="$t('common.next')"
            :aria-label="$t('common.next')"
            @click="selectAdjacentForm(1)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-8" :class="{ 'lg:grid-cols-3': selectedFormId }">
      <!-- Form Fields (Left 2/3) -->
      <div v-if="selectedFormId" class="lg:col-span-2 space-y-4">
        <form @submit.prevent="handleSubmit" v-if="currentForm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="field in requiredFields" :key="field.id" class="form-group">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
              </label>
              
              <div v-if="field.type === 'select'">
                 <AppSelect
                    v-model="formData[field.id]"
                    :options="getOptions(field.options)"
                    :placeholder="field.placeholder || $t('common.select')"
                 />
              </div>

              <div v-else-if="field.type === 'boolean'">
                <label class="flex items-center space-x-2 mt-2 cursor-pointer">
                  <input
                      type="checkbox"
                      v-model="formData[field.id]"
                      class="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-600 dark:text-gray-400">{{ field.label }}</span>
                </label>
              </div>

              <div v-else>
                <input
                    v-model="formData[field.id]"
                    :type="getInputType(field.type)"
                    :placeholder="field.placeholder"
                    :required="field.required"
                    class="form-input w-full"
                    :step="field.type === 'number' || field.type === 'currency' ? 'any' : undefined"
                />
              </div>
              <p v-if="field.unit" class="text-xs text-gray-500 mt-1">{{ field.unit }}</p>
            </div>
          </div>

          <!-- TODO: Replace this temporary optional-fields block with attribute-based rendering at the end of the form. -->
          <div v-if="optionalFields.length > 0" class="mt-4 flex flex-wrap items-end gap-3">
            <div v-for="field in optionalFields" :key="field.id" class="min-w-[5rem]">
              <label
                  v-if="field.type === 'boolean'"
                  class="inline-flex h-12 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <input
                    v-model="formData[field.id]"
                    type="checkbox"
                    class="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span>{{ field.label }}</span>
              </label>

              <div v-else-if="field.type === 'select'" class="min-w-[10rem]">
                <AppSelect
                    v-model="formData[field.id]"
                    :options="getOptions(field.options)"
                    :placeholder="field.placeholder || field.label"
                />
              </div>

              <div v-else class="min-w-[10rem]">
                <input
                    v-model="formData[field.id]"
                    :type="getInputType(field.type)"
                    :placeholder="field.placeholder || field.label"
                    class="form-input w-full"
                    :step="field.type === 'number' || field.type === 'currency' ? 'any' : undefined"
                />
                <p v-if="field.unit" class="text-xs text-gray-500 mt-1">{{ field.unit }}</p>
              </div>
            </div>
          </div>

          <div class="mt-4 space-y-3">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                  v-model="useCustomCreatedAt"
                  type="checkbox"
                  class="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  @change="handleCustomCreatedAtToggle"
              />
              <span>{{ $t('entries.custom_created_at') }}</span>
            </label>

            <input
                v-if="useCustomCreatedAt"
                id="quick-entry-created-at"
                v-model="createdAt"
                type="datetime-local"
                class="form-input w-full"
            />
          </div>

          <div class="mt-6 flex justify-end">
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting">{{ $t('common.loading') }}</span>
              <span v-else>{{ $t('common.save') }}</span>
            </button>
          </div>
        </form>
        <div v-else class="flex justify-center py-8">
           <AppLoader />
        </div>
      </div>

      <!-- Recent Entries -->
      <div
          class="border-gray-200 dark:border-gray-700"
          :class="selectedFormId ? 'lg:col-span-1 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-6' : ''"
      >
        <div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 class="text-lg font-semibold">{{ selectedFormId ? $t('entries.form_recent_entries') : $t('entries.recent_entries') }}</h3>
          <span v-if="!selectedFormId" class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t('entries.sorted_by_created_at') }}
          </span>
        </div>
        
        <div v-if="entriesLoading" class="flex justify-center py-4">
          <AppLoader />
        </div>
        
        <div v-else-if="visibleEntries.length === 0" class="text-center text-gray-500 py-4">
          {{ $t('entries.no_entries') }}
        </div>
        
        <div v-else class="space-y-3 overflow-y-auto pr-2 custom-scrollbar" :class="selectedFormId ? 'max-h-[400px]' : 'max-h-[520px]'">
          <EntryCard 
            v-for="entry in visibleEntries"
            :key="entry.id" 
            :entry="entry" 
            :form-fields="entry.form?.fields || currentForm?.fields" 
            :show-form-name="!selectedFormId"
            show-edit-action
            :show-actions="false" 
            class="bg-gray-50 dark:bg-gray-700 !shadow-none border border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useForms } from '@/composables/useForms'
import { useEntries } from '@/composables/useEntries'
import { useNotification } from '@/composables/useNotification'
import AppSelect from '@/components/common/AppSelect.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import EntryCard from '@/components/entries/EntryCard.vue'
import { useI18n } from 'vue-i18n'
import type { FormField, FormFieldType } from '@/types/form'
import type { Entry } from '@/types/entry'

const { t } = useI18n()
const { forms, fetchForms, fetchForm, currentForm } = useForms()
const { entries, createEntry, fetchEntries } = useEntries()
const { showSuccess } = useNotification()

const selectedFormId = ref('')
const formData = ref<Record<string, any>>({})
const createdAt = ref(getCurrentDateTimeForInput())
const useCustomCreatedAt = ref(false)
const submitting = ref(false)
const entriesLoading = ref(false)
const recentEntries = ref<Entry[]>([])

// In-memory cache for recent entries: { formId: Entry[] }
const cachedEntries = reactive<Record<string, Entry[]>>({})
const RECENT_ENTRIES_LIMIT = 10
const FORM_ENTRIES_LIMIT = 5
const LAST_QUICK_FORM_KEY = 'formaflow:last-quick-form-id'

const quickEntryForms = computed(() => {
  const publishedForms = forms.value.filter(form => form.published)
  const favoriteForms = publishedForms.filter(form => form.quick_entry_favorite)

  return favoriteForms.length > 0 ? favoriteForms : publishedForms
})

const formOptions = computed(() => 
  quickEntryForms.value
    .map(f => ({ label: f.name, value: f.id }))
)

const requiredFields = computed<FormField[]>(() => {
  return currentForm.value?.fields.filter(field => field.required) || []
})

const optionalFields = computed<FormField[]>(() => {
  return currentForm.value?.fields.filter(field => !field.required) || []
})

const visibleEntries = computed<Entry[]>(() => {
  if (!selectedFormId.value) {
    return recentEntries.value
  }

  return cachedEntries[selectedFormId.value] || []
})

watch(entries, nextEntries => {
  if (selectedFormId.value) {
    const matchingEntries = nextEntries.filter(entry => entry.form_id === selectedFormId.value)
    cachedEntries[selectedFormId.value] = sortEntriesByCreatedAt([...matchingEntries]).slice(0, FORM_ENTRIES_LIMIT)
    return
  }

  recentEntries.value = sortEntriesByCreatedAt([...nextEntries]).slice(0, RECENT_ENTRIES_LIMIT)
})

const selectedFormIndex = computed(() => {
  return formOptions.value.findIndex(option => option.value === selectedFormId.value)
})

const selectAdjacentForm = async (direction: -1 | 1) => {
  if (formOptions.value.length === 0) return

  const currentIndex = selectedFormIndex.value === -1 ? 0 : selectedFormIndex.value
  const nextIndex = (currentIndex + direction + formOptions.value.length) % formOptions.value.length
  const nextFormId = String(formOptions.value[nextIndex].value)

  selectedFormId.value = nextFormId
  await handleFormSelect(nextFormId)
}

const handleFormSelect = async (formId: string) => {
  if (!formId) {
    currentForm.value = null
    localStorage.removeItem(LAST_QUICK_FORM_KEY)
    await loadRecentEntries()
    return
  }

  localStorage.setItem(LAST_QUICK_FORM_KEY, formId)
  
  formData.value = {}
  createdAt.value = getCurrentDateTimeForInput()
  useCustomCreatedAt.value = false
  
  // Load Form Definition
  await fetchForm(formId)
  
  entriesLoading.value = !cachedEntries[formId]
  try {
    await fetchEntries(1, formId, FORM_ENTRIES_LIMIT)
    cachedEntries[formId] = sortEntriesByCreatedAt([...entries.value]).slice(0, FORM_ENTRIES_LIMIT)
  } catch (e) {
    console.error(e)
  } finally {
    entriesLoading.value = false
  }
  
  initializeFormDefaults()
}

const handleSubmit = async () => {
  if (!selectedFormId.value || !currentForm.value) return
  
  submitting.value = true
  try {
    const newEntry = await createEntry({
      form_id: selectedFormId.value,
      data: formData.value,
      created_at: useCustomCreatedAt.value ? toIsoDateTime(createdAt.value) : undefined,
    })
    
    const visibleEntry = newEntry || entries.value[0]

    if (visibleEntry?.form_id === selectedFormId.value) {
      if (!cachedEntries[selectedFormId.value]) {
        cachedEntries[selectedFormId.value] = []
      }

      cachedEntries[selectedFormId.value] = withRecentEntry(
        cachedEntries[selectedFormId.value],
        visibleEntry,
        FORM_ENTRIES_LIMIT
      )
      recentEntries.value = withRecentEntry(recentEntries.value, visibleEntry, RECENT_ENTRIES_LIMIT)
    }

    if (!newEntry) {
      showSuccess(t('entries.entry_saved_offline'))
    } else {
      showSuccess(t('entries.entry_created'))
    }
    
    // Reset form data but keep boolean defaults
    formData.value = {}
    createdAt.value = getCurrentDateTimeForInput()
    useCustomCreatedAt.value = false
    initializeFormDefaults()
    
  } catch {
    // Error handled by store
  } finally {
    submitting.value = false
  }
}

const handleCustomCreatedAtToggle = () => {
  if (useCustomCreatedAt.value) {
    createdAt.value = getCurrentDateTimeForInput()
  }
}

const getOptions = (options: any) => {
  if (!options) return []
  let opts = options
  if (typeof opts === 'string') {
    try {
      opts = JSON.parse(opts)
    } catch {
      return []
    }
  }
  
  // If we have { values: [...] } structure
  if (opts && !Array.isArray(opts) && Array.isArray(opts.values)) {
    return opts.values.map((v: string) => ({ label: v, value: v }))
  }
  
  if (Array.isArray(opts)) {
    return opts.map((v: any) => {
      // If it's already a label/value object
      if (typeof v === 'object' && v !== null && 'value' in v && 'label' in v) {
        return v
      }
      // If it's just a string/number
      return { label: v, value: v }
    })
  }
  
  return []
}

const getInputType = (type: FormFieldType) => {
  switch (type) {
    case 'number':
    case 'currency':
      return 'number'
    case 'email':
      return 'email'
    case 'date':
      return 'date'
    default:
      return 'text'
  }
}

function getCurrentDateTimeForInput(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function initializeFormDefaults(): void {
  if (!currentForm.value) {
    return
  }

  currentForm.value.fields.forEach(field => {
    if (field.type === 'boolean') {
      formData.value[field.id] = false
    }
  })
}

async function loadRecentEntries(): Promise<void> {
  entriesLoading.value = true
  try {
    await fetchEntries(1, undefined, RECENT_ENTRIES_LIMIT)
    recentEntries.value = sortEntriesByCreatedAt([...entries.value]).slice(0, RECENT_ENTRIES_LIMIT)
  } catch (e) {
    console.error(e)
  } finally {
    entriesLoading.value = false
  }
}

function withRecentEntry(list: Entry[], entry: Entry, limit: number): Entry[] {
  const withoutDuplicate = list.filter(item => item.id !== entry.id)
  return sortEntriesByCreatedAt([entry, ...withoutDuplicate]).slice(0, limit)
}

function sortEntriesByCreatedAt(list: Entry[]): Entry[] {
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

onMounted(async () => {
  await fetchForms(1, undefined, undefined, false)

  const lastFormId = localStorage.getItem(LAST_QUICK_FORM_KEY)
  if (lastFormId && formOptions.value.some(option => option.value === lastFormId)) {
    selectedFormId.value = lastFormId
    await handleFormSelect(lastFormId)
    return
  }

  await loadRecentEntries()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}
</style>
