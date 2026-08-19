<template>
  <div class="mx-auto max-w-3xl">
    <div v-if="loading" class="card text-center">Готовлю вопросы…</div>
    <div v-else-if="error" class="card text-center text-red-600">{{ error }}</div>
    <template v-else-if="attempt && !result">
      <div class="mb-5 flex items-center justify-between gap-4">
        <button class="text-sm font-bold text-gray-500" @click="router.push('/learn')">← В план</button>
        <div class="h-3 flex-1 overflow-hidden rounded-full bg-gray-200"><div class="h-full rounded-full bg-primary-500 transition-all" :style="{width: `${progress}%`}"></div></div>
        <span class="text-sm font-bold">{{ currentIndex + 1 }}/{{ attempt.assessment.questions.length }}</span>
      </div>
      <section class="question-card">
        <p class="eyebrow text-primary-600">{{ attempt.assessment.title }} · {{ currentQuestion.points }} XP</p>
        <h1 class="mt-4 text-2xl font-black leading-tight sm:text-3xl"><MathText :text="currentQuestion.prompt" /></h1>
        <img v-if="currentQuestion.prompt_media_url" :src="currentQuestion.prompt_media_url" alt="Иллюстрация к вопросу" class="mt-5 max-h-80 w-full rounded-2xl bg-gray-50 object-contain">
        <div class="mt-8"><QuestionInput v-model="answers[currentQuestion.id]" :question="currentQuestion"/></div>
        <div class="mt-10 flex justify-between gap-3">
          <button class="btn-secondary" :disabled="currentIndex === 0" @click="currentIndex--">Назад</button>
          <button v-if="currentIndex < attempt.assessment.questions.length - 1" class="btn-primary px-8" :disabled="!hasAnswer" @click="currentIndex++">Дальше</button>
          <button v-else class="btn-primary px-8" :disabled="submitting || !hasAnswer" @click="submit">{{ submitting ? 'Проверяю…' : 'Завершить' }}</button>
        </div>
      </section>
    </template>
    <section v-else-if="result" class="space-y-5">
      <div class="result-hero" :class="percentage >= 80 ? 'result-hero--great' : 'result-hero--practice'">
        <div class="text-6xl">{{ percentage >= 80 ? '🎉' : '💪' }}</div>
        <h1 class="mt-3 text-3xl font-black">{{ percentage >= 80 ? 'Отличная работа!' : 'Хорошая попытка!' }}</h1>
        <p class="mt-2 text-lg">{{ result.score }} из {{ result.max_points }} баллов · {{ percentage }}%</p>
        <div class="mt-5 flex justify-center gap-6 text-sm font-bold"><span>⭐ {{ result.xp_total }} XP всего</span><span>🔥 {{ result.streak.current }} дней</span></div>
      </div>
      <article v-for="(question, index) in result.questions" :key="question.id" class="card border-l-4" :class="question.is_correct ? 'border-green-500' : 'border-red-400'">
        <p class="text-sm font-bold" :class="question.is_correct ? 'text-green-600' : 'text-red-600'">{{ question.is_correct ? 'Верно' : 'Нужно повторить' }} · вопрос {{ index + 1 }}</p>
        <h2 class="mt-2 font-bold"><MathText :text="question.prompt" /></h2>
        <div class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50"><p class="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Твой ответ</p><p class="mt-1 font-bold">{{ formatLearningAnswer(question.answer, question.options) }}</p></div>
          <div v-if="!question.is_correct" class="rounded-xl bg-green-50 p-3 text-green-900 dark:bg-green-950/50 dark:text-green-100"><p class="text-xs font-bold uppercase tracking-wide">Правильный ответ</p><p class="mt-1 font-black">{{ formatAcceptedAnswers(question.correct_answer, question.options) }}</p></div>
        </div>
        <p v-if="!question.is_correct && question.explanation" class="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"><MathText :text="question.explanation" /></p>
        <div v-if="!question.is_correct && workspace.current?.modules?.tutor" class="mt-3">
          <button class="rounded-xl border border-primary-200 px-4 py-2 text-sm font-bold text-primary-700 dark:border-primary-700 dark:text-primary-200" :disabled="tutorLoading === question.id" @click="askTutor(question.id)">{{ tutorLoading === question.id ? 'Думаю…' : '💬 Объяснить ещё проще' }}</button>
          <div v-if="tutorAnswers[question.id]" class="mt-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900 dark:border-primary-700 dark:bg-primary-900/40 dark:text-primary-50"><div class="flex items-center justify-between gap-2"><p class="font-black">Учебный помощник</p><span v-if="tutorAnswers[question.id].provider === 'mock'" class="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-primary-700 dark:bg-gray-800 dark:text-primary-100">Демо</span></div><p class="mt-2 leading-relaxed">{{ tutorAnswers[question.id].answer }}</p><div class="mt-3 flex flex-wrap gap-2"><span v-for="suggestion in tutorAnswers[question.id].suggestions" :key="suggestion" class="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary-700 dark:bg-gray-800 dark:text-primary-100">{{ suggestion }}</span></div></div>
        </div>
      </article>
      <div class="flex flex-col gap-3 sm:flex-row"><router-link v-if="wrongCount" to="/learn/review" class="btn-primary flex-1 text-center">Разобрать ошибки ({{ wrongCount }})</router-link><router-link to="/learn" :class="wrongCount ? 'btn-secondary' : 'btn-primary'" class="flex-1 text-center">Вернуться к плану</router-link></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {learningApi} from '@/api/learning'
import {useWorkspaceStore} from '@/stores/workspace'
import QuestionInput from '@/components/learning/QuestionInput.vue'
import MathText from '@/components/learning/MathText.vue'
import {formatAcceptedAnswers, formatLearningAnswer} from '@/utils/learningAnswers'
import type {AttemptPayload, AttemptResult} from '@/types/learning'

const route = useRoute()
const router = useRouter()
const workspace = useWorkspaceStore()
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const attempt = ref<AttemptPayload | null>(null)
const result = ref<AttemptResult | null>(null)
const tutorLoading = ref('')
const tutorAnswers = ref<Record<string, {answer: string; suggestions: string[]; provider: string}>>({})
const answers = ref<Record<string, unknown>>({})
const currentIndex = ref(0)
const currentQuestion = computed(() => attempt.value!.assessment.questions[currentIndex.value])
const progress = computed(() => ((currentIndex.value + 1) / (attempt.value?.assessment.questions.length || 1)) * 100)
const hasAnswer = computed(() => {
  const value = answers.value[currentQuestion.value.id]
  return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
})
const percentage = computed(() => result.value?.max_points ? Math.round(result.value.score / result.value.max_points * 100) : 0)
const wrongCount = computed(() => result.value?.questions.filter(item => !item.is_correct).length || 0)

onMounted(async () => {
  try {
    const current = await workspace.load()
    if (!current) throw new Error('Рабочее пространство не найдено')
    attempt.value = await learningApi.startAttempt(current.id, String(route.params.assignmentId))
  } catch (caught) { error.value = (caught as Error).message } finally { loading.value = false }
})

async function submit() {
  if (!attempt.value || !workspace.current) return
  submitting.value = true
  const storageKey = `learning-submit-${attempt.value.attempt.id}`
  let key = sessionStorage.getItem(storageKey)
  if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(storageKey, key) }
  try {
    result.value = (await learningApi.submitAttempt(workspace.current.id, attempt.value.attempt.id, answers.value, key)).result
    window.scrollTo({top: 0, behavior: 'smooth'})
  } catch (caught) { error.value = (caught as Error).message } finally { submitting.value = false }
}
async function askTutor(questionId: string) {
  if (!workspace.current || !result.value) return
  tutorLoading.value = questionId
  try { tutorAnswers.value[questionId] = (await learningApi.askTutor(workspace.current.id, result.value.attempt_id, questionId, 'Объясни мою ошибку простыми словами.')).tutor }
  finally { tutorLoading.value = '' }
}
</script>
