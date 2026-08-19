<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-6"><router-link to="/learn" class="text-sm font-bold text-gray-500">← В план</router-link><p class="eyebrow mt-5 text-amber-700">Работа над ошибками</p><h1 class="text-3xl font-black">Повторяем без спешки</h1></div>
    <div v-if="loading" class="card text-center">Собираю вопросы…</div>
    <div v-else-if="!reviews.length" class="empty-learning"><div class="text-5xl">✨</div><h2 class="mt-3 text-xl font-black">Очередь пуста</h2><p class="mt-1 text-gray-500">Все ошибки на сегодня разобраны.</p></div>
    <section v-else class="question-card">
      <div class="mb-5 flex items-center justify-between"><span class="badge-warning badge">Этап {{ current.stage + 1 }}</span><span class="text-sm text-gray-500">Осталось: {{ reviews.length }}</span></div>
      <h2 class="text-2xl font-black"><MathText :text="current.question.prompt" /></h2>
      <div v-if="!feedback" class="mt-8"><QuestionInput v-model="answer" :question="current.question"/></div>
      <button v-if="!feedback" class="btn-primary mt-8 w-full py-3" :disabled="answer === undefined || submitting" @click="send">{{ submitting ? 'Проверяю…' : 'Ответить' }}</button>
      <div v-else class="mt-6 rounded-2xl p-5" :class="feedback.correct ? 'bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-100' : 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100'">
        <p class="font-black">{{ feedback.correct ? 'Верно! Отличная работа.' : 'Пока не получилось — разберём ответ.' }}</p>
        <p v-if="!feedback.correct" class="mt-3 text-sm"><span class="font-bold">Правильный ответ:</span> {{ formatAcceptedAnswers(feedback.correctAnswer, current.question.options) }}</p>
        <p v-if="feedback.explanation" class="mt-3 text-sm leading-relaxed"><MathText :text="feedback.explanation" /></p>
        <button class="btn-primary mt-5 w-full" @click="nextReview">Дальше</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {learningApi} from '@/api/learning'
import {useWorkspaceStore} from '@/stores/workspace'
import QuestionInput from '@/components/learning/QuestionInput.vue'
import MathText from '@/components/learning/MathText.vue'
import {formatAcceptedAnswers} from '@/utils/learningAnswers'
import type {LearningQuestion} from '@/types/learning'

type Review = {id: string; stage: number; question: LearningQuestion}
const workspace = useWorkspaceStore()
const reviews = ref<Review[]>([])
const loading = ref(true)
const submitting = ref(false)
const answer = ref<unknown>()
const feedback = ref<{correct: boolean; correctAnswer: Record<string, unknown>; explanation?: string | null} | null>(null)
const current = computed(() => reviews.value[0])
onMounted(async () => {
  const active = await workspace.load()
  if (active) reviews.value = (await learningApi.dueReviews(active.id)).reviews
  loading.value = false
})
async function send() {
  if (!workspace.current || !current.value) return
  submitting.value = true
  try {
    const response = await learningApi.answerReview(workspace.current.id, current.value.id, answer.value, crypto.randomUUID())
    feedback.value = {correct: response.feedback.is_correct, correctAnswer: response.feedback.correct_answer, explanation: response.feedback.explanation}
  } finally { submitting.value = false }
}
function nextReview() { reviews.value.shift(); answer.value = undefined; feedback.value = null }
</script>
