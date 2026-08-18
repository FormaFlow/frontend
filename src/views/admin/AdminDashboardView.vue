<template>
  <div class="admin-shell">
    <header class="admin-heading"><div><p class="eyebrow text-primary-600">Семейная школа</p><h1 class="text-3xl font-black">Прогресс учеников</h1><p class="mt-2 text-gray-500">Результаты, регулярность и вопросы на повторение в одном месте.</p></div><router-link to="/admin/assignments" class="btn-primary">Назначить тест</router-link></header>
    <nav class="admin-shortcuts">
      <router-link to="/admin/learners"><span>👥</span><strong>Ученики</strong><small>Профили и PIN</small></router-link>
      <router-link to="/admin/content"><span>📚</span><strong>Контент</strong><small>Тесты и вопросы</small></router-link>
      <router-link to="/admin/assignments"><span>🗓️</span><strong>Назначения</strong><small>Планы и сроки</small></router-link>
    </nav>
    <section class="flex items-center justify-between gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-4 text-primary-950"><div><p class="font-black">Учебный помощник</p><p class="text-sm text-primary-800/70">Контекстный разбор ошибок. Локально используется mock, позже — адаптер BroBot.</p></div><button class="rounded-xl px-4 py-2 text-sm font-bold" :class="tutorEnabled ? 'bg-green-600 text-white' : 'bg-white text-primary-700'" @click="toggleTutor">{{ tutorEnabled ? 'Включён' : 'Включить' }}</button></section>
    <div v-if="loading" class="card text-center">Собираю статистику…</div>
    <div v-else-if="!learners.length" class="empty-learning"><div class="text-5xl">👋</div><h2 class="mt-3 text-xl font-black">Добавьте первого ученика</h2><router-link to="/admin/learners" class="btn-primary mt-5 inline-block">Создать профиль</router-link></div>
    <section v-else class="grid gap-5 xl:grid-cols-2">
      <article v-for="learner in learners" :key="learner.id" class="learner-card">
        <div class="flex items-start justify-between"><div class="flex items-center gap-3"><div class="avatar">{{ learner.name.slice(0, 1) }}</div><div><h2 class="text-xl font-black">{{ learner.name }}</h2><p class="text-sm text-gray-500">{{ learner.target_grade }} класс · @{{ learner.login }}</p></div></div><span v-if="learner.assignments.overdue" class="badge badge-danger">Просрочено: {{ learner.assignments.overdue }}</span></div>
        <div class="mt-6 grid grid-cols-4 gap-2 text-center"><div class="metric"><strong>{{ learner.average_percent }}%</strong><span>средний</span></div><div class="metric"><strong>{{ learner.xp_total }}</strong><span>XP</span></div><div class="metric"><strong>🔥 {{ learner.streak.current }}</strong><span>серия</span></div><div class="metric"><strong>{{ learner.reviews_due }}</strong><span>ошибок</span></div></div>
        <div class="mt-5"><div class="mb-2 flex justify-between text-xs font-bold text-gray-500"><span>Выполнено назначений</span><span>{{ learner.assignments.completed }}/{{ learner.assignments.total }}</span></div><div class="h-2 overflow-hidden rounded-full bg-gray-100"><div class="h-full rounded-full bg-primary-500" :style="{width: completion(learner) + '%'}"></div></div></div>
        <div class="mt-4 flex items-center justify-between"><p class="text-xs text-gray-400">Последняя активность: {{ learner.last_activity_at ? new Date(learner.last_activity_at).toLocaleString('ru-RU') : 'ещё не занимался' }}</p><button class="text-sm font-bold text-primary-600" @click="showTimeline(learner)">История →</button></div>
      </article>
    </section>
    <section v-if="selectedLearner" class="card"><div class="flex items-center justify-between"><div><p class="eyebrow text-primary-600">История по датам</p><h2 class="mt-2 text-xl font-black">{{ selectedLearner.name }}</h2></div><button class="text-gray-500" @click="selectedLearner = null">✕</button></div><div class="mt-5 overflow-x-auto"><table class="table min-w-[560px]"><thead class="table-head"><tr><th>Дата</th><th>Тест</th><th>Предмет</th><th>Результат</th></tr></thead><tbody class="table-body"><tr v-for="attempt in timeline" :key="attempt.id"><td>{{ new Date(attempt.completed_at).toLocaleDateString('ru-RU') }}</td><td class="font-bold">{{ attempt.assessment_title }}</td><td>{{ attempt.subject_code }}</td><td>{{ attempt.score }}/{{ attempt.max_points }} · {{ Math.round(attempt.score / attempt.max_points * 100) }}%</td></tr><tr v-if="!timeline.length"><td colspan="4" class="text-center text-gray-500">Завершённых попыток пока нет</td></tr></tbody></table></div></section>
  </div>
</template>
<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {learningApi, workspaceApi} from '@/api/learning'
import {useWorkspaceStore} from '@/stores/workspace'
import type {LearnerProgress} from '@/types/learning'
const workspace = useWorkspaceStore(); const learners = ref<LearnerProgress[]>([]); const loading = ref(true)
type TimelineAttempt = {id: string; assessment_title: string; subject_code: string; score: number; max_points: number; completed_at: string}
const selectedLearner = ref<LearnerProgress | null>(null); const timeline = ref<TimelineAttempt[]>([])
const tutorEnabled = computed(() => workspace.current?.modules?.tutor === true)
onMounted(async () => { const current = await workspace.load(); if (current) learners.value = (await learningApi.progress(current.id)).learners; loading.value = false })
const completion = (learner: LearnerProgress) => learner.assignments.total ? Math.round(learner.assignments.completed / learner.assignments.total * 100) : 0
async function toggleTutor() { if (!workspace.current) return; const enabled = !tutorEnabled.value; await workspaceApi.updateModule(workspace.current.id, 'tutor', enabled); workspace.current.modules.tutor = enabled }
async function showTimeline(learner: LearnerProgress) { if (!workspace.current) return; selectedLearner.value = learner; timeline.value = (await learningApi.timeline(workspace.current.id, learner.id)).attempts }
</script>
