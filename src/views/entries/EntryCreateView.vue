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
            v-model="selectedFormId"
            :label="$t('forms.title')"
            :options="formOptions"
            required
            :error="errors.form"
        />

        <!-- Form Fields (Dynamic) -->
        <template v-if="selectedForm && selectedForm.fields.length">
          <div
              v-for="field in selectedForm.fields"
              :key="field.id"
              class="form-group"
          >
            <label :for="field.id">
              {{ field.label }} <span v-if="field.required" class="text-red-500">*</span>
            </label>

            <!-- примитивный рендер по типам; можно вынести в отдельный компонент -->
            <input
                v-if="['text','email','currency','number'].includes(field.type)"
                :id="field.id"
                v-model="formData[field.id]"
                :type="field.type === 'email' ? 'email' : 'text'"
                class="form-input"
            />

            <input
                v-else-if="field.type === 'date'"
                :id="field.id"
                v-model="formData[field.id]"
                type="date"
                class="form-input"
            />

            <select
                v-else-if="field.type === 'select'"
                :id="field.id"
                v-model="formData[field.id]"
                class="form-input"
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
                class="form-checkbox"
            />
          </div>
        </template>

        <!-- Tags -->
        <div class="form-group">
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
              <th class="py-2 font-semibold">Question</th>
              <th class="py-2 font-semibold">Your Answer</th>
              <th class="py-2 font-semibold">Correct</th>
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
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, reactive, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import AppSelect from '@/components/common/AppSelect.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import {useEntries} from '@/composables/useEntries'
import {useForms} from '@/composables/useForms'
import {formsApi} from "@/api/forms";
import {validateForm, type ValidationRules} from '@/utils/validation'
import type {Form, FormField} from "@/types/form";

const router = useRouter()
const route = useRoute()
const {loading, createEntry} = useEntries()
const {forms, fetchForms} = useForms()

const selectedFormId = ref('')
const tags = ref<string[]>([])
const newTag = ref('')
const formData = reactive<Record<string, any>>({})

// Quiz specific
const duration = ref(0)
const timerInterval = ref<number | null>(null)
const showResultModal = ref(false)
const quizResult = ref({score: 0, total: 0, results: [] as any[]})

onMounted(async () => {
  await fetchForms()
  if (route.query.form_id) {
    selectedFormId.value = route.query.form_id as string

    // Check if form is present in the list
    if (!forms.value.find((f: Form) => f.id === selectedFormId.value)) {
      try {
        const form = await formsApi.get(selectedFormId.value)
        if (form) {
          forms.value.push(form)
        }
      } catch (e) {
        console.error('Failed to fetch specific form:', e)
      }
    }
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

const selectedForm = computed(() =>
    forms.value.find((f: Form) => f.id === selectedFormId.value)
)

watch(selectedForm, (form) => {
  Object.keys(formData).forEach(k => delete formData[k])
  if (!form) {
    stopTimer()
    return
  }

  form.fields.forEach((field: FormField) => {
    formData[field.id] =
        field.type === 'number' || field.type === 'currency' ? null : ''
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

const getFieldComponent = (type: string) => {
  const components: Record<string, string> = {
    text: 'AppInput',
    email: 'AppInput',
    number: 'AppInput',
    date: 'AppInput',
    select: 'AppSelect',
    boolean: 'div', // Would be a checkbox
    currency: 'AppInput'
  }
  return components[type] || 'AppInput'
}

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

  try {
    const entry = await createEntry({
      form_id: selectedFormId.value,
      data: formData,
      tags: tags.value,
      duration: selectedForm.value?.is_quiz ? duration.value : undefined
    })

    if (entry && selectedForm.value?.is_quiz) {
      const totalPoints = selectedForm.value.fields.reduce((sum, f) => sum + (f.points || 0), 0)

      quizResult.value = {
        score: entry.score || 0,
        total: totalPoints,
        results: (entry as any).quiz_results || []
      }
      showResultModal.value = true
    } else {
      await router.push('/entries')
    }
  } catch (error) {
    console.error('Failed to create entry:', error)
    if (selectedForm.value?.is_quiz) {
      startTimer() // Resume if failed
    }
  }
}

const closeResultModal = () => {
  showResultModal.value = false
  router.push('/entries')
}
</script>
