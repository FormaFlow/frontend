<template>
  <div class="max-w-2xl">
    <div class="flex gap-4 items-center mb-6">
      <router-link to="/entries" class="text-primary-500 hover:underline">
        ← {{ $t('common.back') }}
      </router-link>
      <h1 class="text-2xl font-bold">{{ $t('entries.edit_entry') }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader/>
    </div>
    <div v-else-if="currentEntry" class="card">
      <form @submit.prevent="handleUpdate" class="space-y-6">
        <!-- Entry Data -->
        <div>
          <h2 class="text-lg font-semibold mb-4">{{ $t('common.data') }}</h2>
          <div v-if="currentForm" class="space-y-4">
            <div v-for="field in sortedFields" :key="field.id">
              <AppInput
                  v-if="['text', 'number', 'email', 'date', 'currency'].includes(field.type)"
                  v-model="(currentEntry.data[field.id] as string | number)"
                  :label="field.label"
                  :type="getInputType(field.type)"
                  :required="field.required"
                  :placeholder="field.placeholder"
                  :hint="field.unit"
              />
              <AppSelect
                  v-else-if="field.type === 'select'"
                  v-model="(currentEntry.data[field.id] as string | number | boolean)"
                  :label="field.label"
                  :required="field.required"
                  :options="getOptions(field.options)"
              />
              <label
                  v-else-if="field.type === 'boolean'"
                  class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <input
                    v-model="currentEntry.data[field.id]"
                    type="checkbox"
                    class="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span>
                  {{ field.label }}
                  <span v-if="field.required" class="text-red-500">*</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label class="form-label">{{ $t('entries.tags') }}</label>
          <div class="flex gap-2 mb-2">
            <input
                v-model="newTag"
                type="text"
                :placeholder="$t('entries.add_tag')"
                class="form-input flex-1"
                @keypress.enter.prevent="addTag"
            />
            <button type="button" class="btn-secondary" @click="addTag">Add</button>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="tag in currentEntry.tags || []" :key="tag" class="badge badge-success">
              {{ tag }}
              <button type="button" class="ml-1" :aria-label="`${$t('common.delete')} ${tag}`" @click="removeTag(tag)">×</button>
            </span>
          </div>
        </div>

        <div class="form-group">
          <label for="entry-created-at" class="form-label">{{ $t('entries.created_at') }}</label>
          <input
              id="entry-created-at"
              v-model="createdAt"
              type="datetime-local"
              class="form-input"
          />
        </div>

        <div class="flex gap-4">
          <AppButton type="submit" :disabled="updateLoading">
            {{ updateLoading ? $t('common.loading') : $t('common.save') }}
          </AppButton>
          <router-link to="/entries" class="btn-secondary">
            {{ $t('common.cancel') }}
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import AppLoader from '@/components/common/AppLoader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import {useEntries} from '@/composables/useEntries'
import {useForms} from '@/composables/useForms'
import {useNotification} from '@/composables/useNotification'
import type {FormFieldOption, FormFieldType} from '@/types/form'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const {showSuccess} = useNotification()
const {currentEntry, loading, fetchEntry, updateEntry} = useEntries()
const {currentForm, fetchForm} = useForms()
const updateLoading = ref(false)
const createdAt = ref('')
const newTag = ref('')

const sortedFields = computed(() => {
  return [...(currentForm.value?.fields || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
})

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

const getOptions = (options?: FormFieldOption[] | string | null): FormFieldOption[] => {
  if (!options) return []
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options)
      return getOptions(parsed)
    } catch {
      return []
    }
  }

  if (Array.isArray(options)) {
    return options.map(option => {
      if (typeof option === 'object' && option !== null && 'label' in option && 'value' in option) {
        return option
      }

      return { label: String(option), value: String(option) }
    })
  }

  return []
}

const toLocalDateTimeInput = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const toIsoDateTime = (value: string): string | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (!tag || !currentEntry.value) return

  if (!currentEntry.value.tags) {
    currentEntry.value.tags = []
  }

  if (!currentEntry.value.tags.includes(tag)) {
    currentEntry.value.tags.push(tag)
  }
  newTag.value = ''
}

const removeTag = (tag: string) => {
  if (!currentEntry.value?.tags) return

  currentEntry.value.tags = currentEntry.value.tags.filter(item => item !== tag)
}

const handleUpdate = async () => {
  if (!currentEntry.value) return

  updateLoading.value = true
  try {
    await updateEntry(
        currentEntry.value.id, {
      data: currentEntry.value.data,
      tags: currentEntry.value.tags,
      created_at: toIsoDateTime(createdAt.value),
    })
    showSuccess(t('entries.entry_updated'))
    await router.push('/entries')
  } finally {
    updateLoading.value = false
  }
}

onMounted(async () => {
  await fetchEntry(route.params.id as string)
  if (currentEntry.value) {
    createdAt.value = toLocalDateTimeInput(currentEntry.value.created_at)
    await fetchForm(currentEntry.value.form_id)
  }
})

onUnmounted(() => {
  currentEntry.value = null
  currentForm.value = null
})
</script>
