<template>
  <div class="max-w-2xl">
    <div class="flex gap-4 items-center mb-6 justify-between">
      <div class="flex gap-4 items-center">
        <router-link to="/entries" class="text-primary-500 hover:underline">
          ← {{ $t('common.back') }}
        </router-link>
        <h1 class="text-2xl font-bold">{{ $t('entries.create_entry') }}</h1>
      </div>
      <div v-if="selectedForm?.is_quiz" class="text-xl font-mono bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded">
        ⏱ {{ formattedDuration }}
      </div>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Form Selection -->
        <AppSelect
            v-if="!route.query.form_id"
            v-model="selectedFormId"
            :label="$t('forms.title')"
            :options="formOptions"
            required
            :error="errors.form"
        />

        <div v-if="selectedForm && route.query.form_id" class="mb-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ selectedForm.name }}</h2>
          <p v-if="selectedForm.description" class="text-gray-600 dark:text-gray-400 mt-1">{{ selectedForm.description }}</p>
        </div>

        <!-- Form Fields (Dynamic) -->
        <template v-if="selectedForm && selectedForm.fields.length">
          <div
              v-for="field in selectedForm.fields"
              :key="field.id"
              class="form-group"
              :class="{'p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6 border border-gray-100 dark:border-gray-700': selectedForm.is_quiz}"
          >
            <label :for="field.id" class="form-label mb-3 block" :class="{'text-base font-medium': selectedForm.is_quiz}">
              {{ field.label }} <span v-if="field.required" class="text-red-500">*</span>
            </label>

            <input
                v-if="['text','email','currency','number'].includes(field.type)"
                :id="field.id"
                v-model="formData[field.id]"
                :type="['number', 'currency'].includes(field.type) ? 'number' : (field.type === 'email' ? 'email' : 'text')"
                :class="['form-input', fieldErrors[field.id] ? 'border-red-500 focus:ring-red-500' : '']"
                :step="['number', 'currency'].includes(field.type) ? 'any' : undefined"
            />

            <input
                v-else-if="field.type === 'date'"
                :id="field.id"
                v-model="formData[field.id]"
                type="date"
                :class="['form-input', fieldErrors[field.id] ? 'border-red-500 focus:ring-red-500' : '']"
            />

            <!-- Quiz Choice Style (Radio group) -->
            <div
                v-else-if="field.type === 'select' && selectedForm?.is_quiz"
                class="flex flex-col gap-3"
            >
              <label
                  v-for="(opt, idx) in (field.options || [])"
                  :key="String(opt.value ?? idx)"
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  :class="{'ring-2 ring-primary-500 border-primary-500': formData[field.id] === opt.value}"
              >
                <input
                    type="radio"
                    :name="field.id"
                    :value="opt.value"
                    v-model="formData[field.id]"
                    class="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span class="text-sm text-gray-900 dark:text-gray-100">{{ opt.label }}</span>
              </label>
            </div>

            <select
                v-else-if="field.type === 'select'"
                :id="field.id"
                v-model="formData[field.id]"
                :class="['form-input', fieldErrors[field.id] ? 'border-red-500 focus:ring-red-500' : '']"
            >
              <option value="" disabled>Выберите...</option>
              <option
                  v-for="(opt, idx) in (field.options || [])"
                  :key="String(opt.value ?? idx)"
                  :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>

            <input
                v-else-if="field.type === 'boolean'"
                :id="field.id"
                v-model="formData[field.id]"
                type="checkbox"
                :class="['form-checkbox', fieldErrors[field.id] ? 'border-red-500' : '']"
            />

            <p v-if="fieldErrors[field.id]" class="text-red-500 text-xs mt-1">
              {{ fieldErrors[field.id] }}
            </p>
          </div>
        </template>

        <!-- Tags -->
        <div v-if="!selectedForm?.is_quiz" class="form-group">
          <label class="form-label">{{ $t('entries.tags') }}</label>
          <div class="flex gap-2 mb-2">
            <input
                v-model="newTag"
                type="text"
                :placeholder="$t('entries.add_tag')"
                class="form-input flex-1"
                @keypress.enter="addTag"
            />
            <button type="button" class="btn-secondary" @click="addTag">Add</button>
          </div>
          <div class="flex gap-2">
            <span v-for="tag in tags" :key="tag" class="badge badge-success">
              {{ tag }}
              <button type="button" @click="removeTag(tag)" class="ml-1">×</button>
            </span>
          </div>
        </div>

        <div class="flex gap-4">
          <AppButton type="submit" :disabled="loading">
            {{ loading ? $t('common.loading') : $t('common.create') }}
          </AppButton>
          <router-link to="/entries" class="btn-secondary">
            {{ $t('common.cancel') }}
          </router-link>
        </div>
      </form>
    </div>

    <AppModal
        :is-open="showResultModal"
        :title="$t('forms.quiz_result')"
        :confirm-text="$t('common.close')"
        :show-cancel="false"
        max-width="max-w-lg"
        @close="closeResultModal"
        @confirm="closeResultModal"
    >
      <div class="text-center space-y-4">
        <div class="text-4xl">🏆</div>
        <div class="text-2xl font-bold">
          {{ $t('forms.your_score') }}: {{ quizResult.score }} / {{ quizResult.total }}
        </div>
        <div class="text-gray-600">
          {{ $t('forms.time_taken') }}: {{ formattedDuration }}
        </div>

        <div class="overflow-auto max-h-[50vh] text-left mt-6 pr-2" v-if="quizResult.results && quizResult.results.length">
          <table class="w-full text-sm">
            <thead>
            <tr class="border-b dark:border-gray-700">
              <th class="py-2 font-semibold text-left">{{ $t('quiz.question') }}</th>
              <th class="py-2 font-semibold text-left">{{ $t('quiz.your_answer') }}</th>
              <th class="py-2 font-semibold text-left">{{ $t('quiz.correct') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(res, idx) in quizResult.results" :key="idx" class="border-b dark:border-gray-700 last:border-0">
              <td class="py-2 pr-2">{{ res.label }}</td>
              <td class="py-2 pr-2">
                  <span :class="res.is_correct ? 'text-green-600 font-bold' : 'text-red-600'">
                    {{ res.user_answer }}
                  </span>
              </td>
              <td class="py-2 pr-2 text-gray-500">
                <span v-if="!res.is_correct">{{ res.correct_answer }}</span>
                <span v-else class="text-green-600">✓</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-center pt-4">
          <button type="button" class="btn-primary flex items-center gap-2" @click="handleShareResult">
            <span>🔗 {{ $t('forms.share_result') }}</span>
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, reactive, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import AppSelect from '@/components/common/AppSelect.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import {useEntries} from '@/composables/useEntries'
import {useForms} from '@/composables/useForms'
import {useNotification} from '@/composables/useNotification'
import {formsApi} from "@/api/forms";
import {validateForm, type ValidationRules} from '@/utils/validation'
import type {Form, FormField} from "@/types/form";

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const {loading, createEntry} = useEntries()
const {forms, fetchForms, fetchForm, currentForm} = useForms()
const {showSuccess} = useNotification()

const selectedFormId = ref('')
const createdEntryId = ref('')
const tags = ref<string[]>([])
const newTag = ref('')
const formData = reactive<Record<string, any>>({})
const fieldErrors = reactive<Record<string, string>>({})

// Quiz specific
const duration = ref(0)
const timerInterval = ref<number | null>(null)
const showResultModal = ref(false)
const quizResult = ref({score: 0, total: 0, results: [] as any[]})

const getLocalizedError = (msg: string) => {
  if (typeof msg !== 'string') return msg
  
  // Laravel error often looks like: "The <label> field is required."
  // or with UUID: "The data.uuid field is required."
  
  // 1. Remove "The " prefix
  let cleanMsg = msg.replace(/^The\s/i, '')
  
  // 2. Remove " field " part (Laravel inserts it between attribute and rule message)
  cleanMsg = cleanMsg.replace(/\sfield\s/i, ' ')
  
  // 3. Remove trailing dot
  cleanMsg = cleanMsg.replace(/\.$/, '')

  // Now cleanMsg is something like "Amount is required" or "data.uuid must be numeric"
  
  if (cleanMsg.toLowerCase().includes('is required')) {
    return t('validation.field_required')
  }
  if (cleanMsg.toLowerCase().includes('must be a number') || cleanMsg.toLowerCase().includes('must be numeric')) {
    return t('validation.field_numeric')
  }
  
  // For other errors (like max, min), try to remove the field name from the start if it matches a known pattern
  // but for now, just return capitalized cleaned message
  return cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1)
}

onMounted(async () => {
  const formIdFromQuery = route.query.form_id as string
  
  if (formIdFromQuery) {
    selectedFormId.value = formIdFromQuery
    // Fetch only the specific form we need
    try {
      await fetchForm(formIdFromQuery)
    } catch (e) {
      console.error('Failed to fetch specific form:', e)
    }
  } else {
    // Only fetch the full list if we need to show the selection dropdown
    // Filter by is_quiz=0 to show only regular forms
    await fetchForms(1, undefined, undefined, false)
  }
})

const errors = reactive({
  form: ''
})

const rules: ValidationRules = {
  form: {required: true}
}

const formOptions = computed(() =>
    forms.value.map((f: Form) => ({label: f.name, value: f.id}))
)

const selectedForm = computed(() => {
  if (currentForm.value && currentForm.value.id === selectedFormId.value) {
    return currentForm.value
  }
  return forms.value.find((f: Form) => f.id === selectedFormId.value)
})

watch(selectedForm, (form) => {
  Object.keys(formData).forEach(k => delete formData[k])
  Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  if (!form) {
    stopTimer()
    return
  }

  form.fields.forEach((field: FormField) => {
    if (field.type === 'boolean') {
      formData[field.id] = false
    }
  })

  // Start timer if quiz
  if (form.is_quiz) {
    startTimer()
  } else {
    stopTimer()
  }
})

const startTimer = () => {
  stopTimer()
  duration.value = 0
  timerInterval.value = window.setInterval(() => {
    duration.value++
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

onUnmounted(() => {
  stopTimer()
})

const formattedDuration = computed(() => {
  const m = Math.floor(duration.value / 60)
  const s = duration.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

const addTag = () => {
  if (newTag.value && !tags.value.includes(newTag.value)) {
    tags.value.push(newTag.value)
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  const idx = tags.value.indexOf(tag)
  if (idx !== -1) {
    tags.value.splice(idx, 1)
  }
}

const handleSubmit = async () => {
  const validation = validateForm({form: selectedFormId.value}, rules)

  if (!validation.isValid) {
    Object.assign(errors, validation.errors)
    return
  }

  stopTimer()
  Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])

  // Filter out empty values to handle optional fields correctly
  const filteredData = { ...formData }
  Object.keys(filteredData).forEach(key => {
    const val = filteredData[key]
    if (val === '' || val === null || val === undefined) {
      delete filteredData[key]
    }
  })

  try {
    const entry = await createEntry({
      form_id: selectedFormId.value,
      data: filteredData,
      tags: tags.value,
      duration: selectedForm.value?.is_quiz ? duration.value : undefined
    })

    if (!entry) {
      showSuccess(t('entries.entry_saved_offline'))
      await router.push('/entries')
      return
    }

    if (entry && selectedForm.value?.is_quiz) {
      const totalPoints = selectedForm.value.fields.reduce((sum, f) => sum + (f.points || 0), 0)

      createdEntryId.value = entry.id
      quizResult.value = {
        score: entry.score || 0,
        total: totalPoints,
        results: (entry as any).quiz_results || []
      }
      showResultModal.value = true
    } else {
      showSuccess(t('entries.entry_created'))
      await router.push('/entries')
    }
  } catch (error: any) {
    console.error('Failed to create entry:', error)
    
    if (error.errors) {
      Object.entries(error.errors).forEach(([key, messages]: [string, any]) => {
        const fieldId = key.replace('data.', '')
        const msg = Array.isArray(messages) ? messages[0] : messages
        fieldErrors[fieldId] = getLocalizedError(msg)
      })
    }

    if (selectedForm.value?.is_quiz) {
      startTimer() // Resume if failed
    }
  }
}

const closeResultModal = () => {
  showResultModal.value = false
  // Don't redirect, let user see the form or share result.
  // Optionally reset the form?
  // For now, just close modal.
}

const handleShareResult = async () => {
  if (!createdEntryId.value) return
  
  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  const backendBase = apiBase.replace(/\/api(\/v1)?\/?$/, '')
  const link = `${backendBase}/shared/result/${createdEntryId.value}?lang=${locale.value}`
  
  try {
    await navigator.clipboard.writeText(link)
    showSuccess(t('forms.link_copied'))
  } catch (err) {
    console.error('Failed to copy link', err)
  }
}
</script>
