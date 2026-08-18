<template>
  <div class="learning-shell">
    <section class="hero-card">
      <div>
        <p class="eyebrow">План на сегодня</p>
        <h1 class="mt-2 text-3xl font-black sm:text-4xl">Привет, {{ auth.user?.name }}!</h1>
        <p class="mt-2 text-white/80">Небольшой шаг каждый день — и сложное становится понятным.</p>
      </div>
      <div class="mt-6 grid grid-cols-3 gap-2 sm:mt-0 sm:min-w-80">
        <div class="hero-stat"><strong>{{ today?.xp_total || 0 }}</strong><span>XP</span></div>
        <div class="hero-stat"><strong>{{ today?.streak.current || 0 }}</strong><span>дней подряд</span></div>
        <div class="hero-stat"><strong>{{ today?.reviews_due || 0 }}</strong><span>повторить</span></div>
      </div>
    </section>

    <div v-if="loading" class="card text-center">Загружаю твой план…</div>
    <template v-else>
      <section v-if="today?.reviews_due" class="review-banner">
        <div><p class="font-bold">Закрепим ошибки?</p><p class="text-sm text-amber-900/70">В очереди {{ today.reviews_due }} {{ plural(today.reviews_due, 'вопрос', 'вопроса', 'вопросов') }}.</p></div>
        <router-link to="/learn/review" class="rounded-xl bg-amber-900 px-4 py-3 font-bold text-white">Повторить</router-link>
      </section>
      <section v-if="today?.achievements.length"><p class="eyebrow text-primary-600">Мои достижения</p><div class="mt-3 flex flex-wrap gap-3"><div v-for="code in today.achievements" :key="code" class="flex items-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-black text-yellow-900"><span class="text-xl">{{ achievement(code).icon }}</span>{{ achievement(code).label }}</div></div></section>

      <section>
        <div class="mb-4 flex items-end justify-between"><div><p class="eyebrow text-primary-600">Задания</p><h2 class="text-2xl font-black">Что будем решать</h2></div></div>
        <div v-if="today?.assignments.length" class="grid gap-4 md:grid-cols-2">
          <router-link v-for="assignment in today.assignments" :key="assignment.id" :to="`/learn/assignments/${assignment.id}`" class="task-card group">
            <div class="subject-icon">{{ subjectIcon(assignment.subject_code) }}</div>
            <div class="min-w-0 flex-1"><p class="text-xs font-bold uppercase tracking-wider text-primary-600">{{ subjectName(assignment.subject_code) }}</p><h3 class="mt-1 text-lg font-black">{{ assignment.title }}</h3><p class="mt-2 text-sm text-gray-500">{{ assignment.status === 'in_progress' ? 'Продолжить попытку' : 'Новое задание' }}</p></div>
            <span class="text-2xl text-primary-500 transition group-hover:translate-x-1">→</span>
          </router-link>
        </div>
        <div v-else class="empty-learning"><div class="text-5xl">🌿</div><h3 class="mt-3 text-xl font-black">На сегодня всё!</h3><p class="mt-1 text-gray-500">Можно отдохнуть или повторить старые ошибки.</p></div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {learningApi} from '@/api/learning'
import {useAuthStore} from '@/stores/auth'
import {useWorkspaceStore} from '@/stores/workspace'
import type {TodayPayload} from '@/types/learning'

const auth = useAuthStore()
const workspace = useWorkspaceStore()
const today = ref<TodayPayload | null>(null)
const loading = ref(true)
onMounted(async () => {
  const current = await workspace.load()
  if (current) today.value = await learningApi.today(current.id)
  loading.value = false
})
const subjectIcon = (subject: string) => ({math: '∑', russian: 'А', reading: '📖'}[subject] || '✦')
const subjectName = (subject: string) => ({math: 'Математика', russian: 'Русский язык', reading: 'Чтение'}[subject] || subject)
const plural = (count: number, one: string, few: string, many: string) => count % 10 === 1 && count % 100 !== 11 ? one : count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14) ? few : many
const achievement = (code: string) => ({first_steps: {icon: '🌱', label: 'Первый шаг'}, perfect_score: {icon: '🏆', label: 'Без ошибок'}, streak_3: {icon: '🔥', label: 'Три дня подряд'}}[code] || {icon: '⭐', label: code})
</script>
