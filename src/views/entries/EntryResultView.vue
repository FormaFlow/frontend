<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex gap-4 items-center mb-6 justify-between">
      <div class="flex gap-4 items-center">
        <router-link to="/entries" class="text-primary-500 hover:underline">
          ← {{ $t('entries.title') }}
        </router-link>
        <h1 class="text-2xl font-bold">{{ $t('forms.quiz_result') }}</h1>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader/>
    </div>
    <div v-else-if="currentEntry && currentForm" class="card text-center space-y-6">
      <h2 class="text-xl font-bold">{{ currentForm.name }}</h2>
      
      <div class="text-6xl">🏆</div>
      <div class="text-3xl font-bold">
        {{ $t('forms.your_score') }}: {{ currentEntry.score }} / {{ totalPoints }}
      </div>
      <div class="text-gray-600" v-if="currentEntry.duration">
        {{ $t('forms.time_taken') }}: {{ formatDuration(currentEntry.duration) }}
      </div>

      <div class="overflow-auto max-h-[50vh] text-left mt-6 pr-2" v-if="results.length">
        <table class="w-full text-sm">
          <thead>
          <tr class="border-b dark:border-gray-700">
            <th class="py-2 font-semibold text-left">{{ $t('quiz.question') }}</th>
            <th class="py-2 font-semibold text-left">{{ $t('quiz.your_answer') }}</th>
            <th class="py-2 font-semibold text-left">{{ $t('quiz.correct') }}</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(res, idx) in results" :key="idx" class="border-b dark:border-gray-700 last:border-0">
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

      <div class="flex justify-center gap-4 pt-4">
        <button type="button" class="btn-primary flex items-center gap-2" @click="handleShare">
          <span>🔗 {{ $t('forms.share_result') }}</span>
        </button>
        <router-link :to="`/entries/create?form_id=${currentForm.id}`" class="btn-secondary">
          {{ $t('forms.want_to_try') }}
        </router-link>
      </div>
    </div>
    <div v-else class="text-center py-12">
      <p class="text-gray-500">Entry not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLoader from '@/components/common/AppLoader.vue'
import { useEntries } from '@/composables/useEntries'
import { useForms } from '@/composables/useForms'
import { useNotification } from '@/composables/useNotification'

const route = useRoute()
const { t, locale } = useI18n()
const { currentEntry, fetchPublicEntry, loading: entryLoading } = useEntries()
const { currentForm, fetchPublicForm, loading: formLoading } = useForms()
const { showSuccess } = useNotification()

const loading = computed(() => entryLoading.value || formLoading.value)

const totalPoints = computed(() => {
  if (!currentForm.value) return 0
  return currentForm.value.fields.reduce((sum, f) => sum + (f.points || 0), 0)
})

const results = computed(() => {
  if (!currentEntry.value || !currentForm.value) return []
  
  return currentForm.value.fields.map(field => {
    const userAnswer = currentEntry.value?.data[field.id]
    const correctAnswer = field.correctAnswer
    const isCorrect = String(userAnswer) === String(correctAnswer)
    
    return {
      label: field.label,
      user_answer: userAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect
    }
  })
})

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const handleShare = async () => {
  if (!currentEntry.value) return
  
  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  const backendBase = apiBase.replace(/\/api(\/v1)?\/?$/, '')
  const link = `${backendBase}/shared/result/${currentEntry.value.id}?lang=${locale.value}`
  
  try {
    await navigator.clipboard.writeText(link)
    showSuccess(t('forms.link_copied'))
  } catch (err) {
    console.error('Failed to copy link', err)
  }
}

onMounted(async () => {
  const id = route.params.id as string
  const lang = route.query.lang as string
  
  if (lang && ['en', 'ru'].includes(lang)) {
    locale.value = lang
  }

  if (id) {
    await fetchPublicEntry(id)
    if (currentEntry.value) {
      await fetchPublicForm(currentEntry.value.form_id)
    }
  }
})

onUnmounted(() => {
  currentEntry.value = null
  currentForm.value = null
})
</script>
