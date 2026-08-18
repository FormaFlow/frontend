<template>
  <section class="mx-auto max-w-4xl space-y-6">
    <header>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ $t('quizzes.title') }}</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ $t('quizzes.subtitle') }}</p>
    </header>

    <p v-if="loading && quizzes.length === 0" class="text-gray-500">{{ $t('common.loading') }}</p>
    <p v-else-if="quizzes.length === 0" class="card text-gray-500 dark:text-gray-400">
      {{ $t('quizzes.empty') }}
    </p>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <article v-for="quiz in quizzes" :key="quiz.id" class="card flex min-w-0 flex-col gap-4">
        <div class="min-w-0 flex-1">
          <div class="mb-2 flex flex-wrap gap-2 text-xs font-medium">
            <span class="rounded-full bg-primary-50 px-2 py-1 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              {{ $t(`quizzes.${quiz.access_type}`) }}
            </span>
            <span
                v-if="quiz.completed_at"
                class="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            >
              {{ $t('quizzes.completed') }}
            </span>
            <span
                v-else-if="hasDraft(quiz.id)"
                class="rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            >
              {{ $t('quizzes.started') }}
            </span>
            <span
                v-if="offlineAvailable.has(quiz.id)"
                class="rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              {{ $t('quizzes.offline_available') }}
            </span>
          </div>
          <h2 class="break-words text-lg font-semibold text-gray-900 dark:text-white">{{ quiz.name }}</h2>
          <p v-if="quiz.description" class="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
            {{ quiz.description }}
          </p>
          <p class="mt-2 text-xs text-gray-500">
            {{ $t('forms.question_count', {count: quiz.fields_count}) }}
          </p>
        </div>
        <router-link
            :to="{name: 'entry-create', query: {form_id: quiz.id}}"
            class="btn-primary w-full text-center"
        >
          {{ $t('quizzes.open') }}
        </router-link>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {formsApi} from '@/api/forms'
import {db} from '@/db'
import {useAuthStore} from '@/stores/auth'
import type {QuizSummary} from '@/types/form'
import {getRememberedQuizIds, hasQuizDraft, rememberQuiz} from '@/utils/quizLibrary'
import {isNetworkError} from '@/utils/network'

const authStore = useAuthStore()
const quizzes = ref<QuizSummary[]>([])
const loading = ref(true)
const offlineAvailable = ref(new Set<string>())

const userId = () => authStore.user?.id || ''
const hasDraft = (formId: string) => Boolean(userId() && hasQuizDraft(userId(), formId))

const loadCached = async () => {
  if (!userId()) return
  const ids = getRememberedQuizIds(userId())
  const cached = await db.getFormSummariesByIds(ids)
  quizzes.value = cached
    .filter(form => form.is_quiz)
    .map(form => ({
      ...form,
      access_type: (form as QuizSummary).access_type || 'opened',
      completed_at: (form as QuizSummary).completed_at || null
    }))

  const definitions = await Promise.all(ids.map(id => db.getFormDefinition(id)))
  offlineAvailable.value = new Set(definitions.filter(Boolean).map(form => form!.id))
}

const cacheDefinitions = async (items: QuizSummary[]) => {
  await Promise.allSettled(items.map(async item => {
    const form = await formsApi.get(item.id)
    if (!form) return
    await db.saveForms([JSON.parse(JSON.stringify(form))])
    offlineAvailable.value = new Set([...offlineAvailable.value, item.id])
  }))
}

onMounted(async () => {
  await loadCached()
  if (!navigator.onLine || !userId()) {
    loading.value = false
    return
  }

  try {
    const response = await formsApi.quizzes()
    if (response) {
      quizzes.value = response.quizzes
      response.quizzes.forEach(quiz => rememberQuiz(userId(), quiz.id))
      await db.saveFormSummaries(JSON.parse(JSON.stringify(response.quizzes)))
      await cacheDefinitions(response.quizzes)
    }
  } catch (error: unknown) {
    if (!isNetworkError(error)) {
      console.error('Failed to load quizzes:', error)
    }
  } finally {
    loading.value = false
  }
})
</script>
