<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-6"><router-link to="/learn" class="text-sm font-bold text-gray-500">← В план</router-link><p class="eyebrow mt-5 text-amber-700">Работа над ошибками</p><h1 class="text-3xl font-black">Повторяем без спешки</h1></div>
    <div v-if="loading" class="card text-center">Собираю вопросы…</div>
    <div v-else-if="!reviews.length" class="empty-learning"><div class="text-5xl">✨</div><h2 class="mt-3 text-xl font-black">Очередь пуста</h2><p class="mt-1 text-gray-500">Все ошибки на сегодня разобраны.</p></div>
    <section v-else class="question-card">
      <div class="mb-5 flex items-center justify-between"><span class="badge-warning badge">Этап {{ current.stage + 1 }}</span><span class="text-sm text-gray-500">Осталось: {{ reviews.length }}</span></div>
      <h2 class="text-2xl font-black"><MathText :text="current.question.prompt" /></h2>
      <div class="mt-8"><QuestionInput v-model="answer" :question="current.question"/></div>
      <button class="btn-primary mt-8 w-full py-3" :disabled="answer === undefined || submitting" @click="send">{{ submitting ? 'Проверяю…' : 'Ответить' }}</button>
      <p v-if="feedback" class="mt-4 rounded-xl p-4 text-center font-bold" :class="feedback.correct ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'">{{ feedback.text }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {learningApi} from '@/api/learning'
import {useWorkspaceStore} from '@/stores/workspace'
import QuestionInput from '@/components/learning/QuestionInput.vue'
import MathText from '@/components/learning/MathText.vue'
import type {LearningQuestion} from '@/types/learning'

type Review = {id: string; stage: number; question: LearningQuestion}
const workspace = useWorkspaceStore()
const reviews = ref<Review[]>([])
const loading = ref(true)
const submitting = ref(false)
const answer = ref<unknown>()
const feedback = ref<{correct: boolean; text: string} | null>(null)
const current = computed(() => reviews.value[0])
onMounted(async () => {
  const active = await workspace.load()
  if (active) reviews.value = (await learningApi.dueReviews(active.id)).reviews
  loading.value = false
})
async function send() {
  if (!workspace.current || !current.value) return
  submitting.value = true
  const response = await learningApi.answerReview(workspace.current.id, current.value.id, answer.value, crypto.randomUUID()) as {review: {stage: number}}
  const improved = response.review.stage > current.value.stage
  feedback.value = {correct: improved, text: improved ? 'Верно! Интервал до следующего повтора увеличен.' : 'Пока не получилось — вернёмся к вопросу завтра.'}
  setTimeout(() => { reviews.value.shift(); answer.value = undefined; feedback.value = null; submitting.value = false }, 900)
}
</script>
