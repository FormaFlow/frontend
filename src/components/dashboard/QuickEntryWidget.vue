<template>
  <div class="card bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 quick-entry-widget">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 class="text-xl font-bold">{{ $t('entries.create_entry') }}</h2>
      <AppSelect
        v-model="selectedFormId"
        :options="formOptions"
        :placeholder="$t('reports.custom.select_form')"
        class="w-full sm:w-64"
        @update:modelValue="handleFormSelect"
      />
    </div>

    <div v-if="selectedFormId" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Form Fields (Left 2/3) -->
      <div class="lg:col-span-2 space-y-4">
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

      <!-- Recent Entries (Right 1/3) -->
      <div class="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-6 lg:pt-0 lg:pl-6">
        <h3 class="text-lg font-semibold mb-4">{{ $t('entries.title') }}</h3>
        
        <div v-if="entriesLoading" class="flex justify-center py-4">
          <AppLoader />
        </div>
        
        <div v-else-if="cachedEntries[selectedFormId]?.length === 0" class="text-center text-gray-500 py-4">
          {{ $t('entries.no_entries') }}
        </div>
        
        <div v-else class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <EntryCard 
            v-for="entry in cachedEntries[selectedFormId]" 
            :key="entry.id" 
            :entry="entry" 
            :form-fields="entry.form?.fields || currentForm?.fields" 
            :show-actions="false" 
            class="bg-gray-50 dark:bg-gray-700 !shadow-none border border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
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
const { createEntry, fetchEntries } = useEntries()
const { showSuccess } = useNotification()

const selectedFormId = ref('')
const formData = ref<Record<string, any>>({})
const createdAt = ref(getCurrentDateTimeForInput())
const useCustomCreatedAt = ref(false)
const submitting = ref(false)
const entriesLoading = ref(false)

// In-memory cache for recent entries: { formId: Entry[] }
const cachedEntries = reactive<Record<string, Entry[]>>({})

const formOptions = computed(() => 
  forms.value
    .filter(f => f.published)
    .map(f => ({ label: f.name, value: f.id }))
)

const requiredFields = computed<FormField[]>(() => {
  return currentForm.value?.fields.filter(field => field.required) || []
})

const optionalFields = computed<FormField[]>(() => {
  return currentForm.value?.fields.filter(field => !field.required) || []
})

const handleFormSelect = async (formId: string) => {
  if (!formId) {
    currentForm.value = null
    return
  }
  
  formData.value = {}
  createdAt.value = getCurrentDateTimeForInput()
  useCustomCreatedAt.value = false
  
  // Load Form Definition
  await fetchForm(formId)
  
  // Load Recent Entries (with Cache check)
  if (!cachedEntries[formId]) {
    entriesLoading.value = true
    try {
      await fetchEntries(1, formId, 5) // Limit 5 for recent
      const { entries: globalEntries } = useEntries() 
      cachedEntries[formId] = [...globalEntries.value] // Copy to cache
    } catch (e) {
      console.error(e)
    } finally {
      entriesLoading.value = false
    }
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
    
    if (!newEntry) {
      showSuccess(t('entries.entry_saved_offline'))
    } else {
      // Update Cache
      if (!cachedEntries[selectedFormId.value]) {
        cachedEntries[selectedFormId.value] = []
      }
      // Prepend new entry
      cachedEntries[selectedFormId.value].unshift(newEntry)
      // Keep only 5
      if (cachedEntries[selectedFormId.value].length > 5) {
        cachedEntries[selectedFormId.value] = cachedEntries[selectedFormId.value].slice(0, 5)
      }
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

onMounted(async () => {
  await fetchForms(1, undefined, undefined, false)
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
