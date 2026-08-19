<template>
  <div class="admin-shell">
    <header class="admin-heading"><div><p class="eyebrow text-primary-600">Семейная школа</p><h1 class="text-3xl font-black">Прогресс учеников</h1><p class="mt-2 text-gray-500">Результаты, регулярность и вопросы на повторение в одном месте.</p></div><router-link v-if="workspace.isManager" to="/admin/assignments" class="btn-primary">Назначить тест</router-link></header>
    <PushNotificationPrompt audience="guardian" />
    <nav v-if="workspace.isManager" class="admin-shortcuts">
      <router-link to="/admin/learners"><span>👥</span><strong>Ученики</strong><small>Профили и PIN</small></router-link>
      <router-link to="/admin/content"><span>📚</span><strong>Контент</strong><small>Тесты и вопросы</small></router-link>
      <router-link to="/admin/assignments"><span>🗓️</span><strong>Назначения</strong><small>Планы и сроки</small></router-link>
    </nav>
    <section v-if="workspace.isManager" class="flex items-center justify-between gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-primary-900 dark:border-primary-700 dark:bg-primary-900/40 dark:text-primary-50"><div><p class="font-black">Помощник при разборе ошибок</p><p class="text-sm text-primary-800 dark:text-primary-100">После теста ученик сможет нажать «Объяснить ещё проще» у неверного ответа. Сейчас работает безопасный демо-режим; BroBot подключим через тот же интерфейс.</p></div><button class="shrink-0 rounded-xl px-4 py-2 text-sm font-bold" :class="tutorEnabled ? 'bg-green-600 text-white' : 'bg-white text-primary-700 dark:bg-gray-800 dark:text-primary-100'" @click="toggleTutor">{{ tutorEnabled ? 'Включён' : 'Включить' }}</button></section>
    <div v-if="loading" class="card text-center">Собираю статистику…</div>
    <div v-else-if="!learners.length" class="empty-learning"><div class="text-5xl">👋</div><h2 class="mt-3 text-xl font-black">{{ workspace.isManager ? 'Добавьте первого ученика' : 'Данных учеников пока нет' }}</h2><router-link v-if="workspace.isManager" to="/admin/learners" class="btn-primary mt-5 inline-block">Создать профиль</router-link></div>
    <section v-else class="grid gap-5 xl:grid-cols-2">
      <article v-for="learner in learners" :key="learner.id" class="learner-card">
        <div class="flex items-start justify-between"><div class="flex items-center gap-3"><div class="avatar">{{ learner.name.slice(0, 1) }}</div><div><h2 class="text-xl font-black">{{ learner.name }}</h2><p class="text-sm text-gray-500">{{ learner.target_grade }} класс<span v-if="learner.login"> · @{{ learner.login }}</span></p></div></div><span v-if="learner.assignments.overdue" class="badge badge-danger">Просрочено: {{ learner.assignments.overdue }}</span></div>
        <div class="mt-6 grid grid-cols-4 gap-2 text-center"><div class="metric"><strong>{{ learner.average_percent }}%</strong><span>средний</span></div><div class="metric"><strong>{{ learner.xp_total }}</strong><span>XP</span></div><div class="metric"><strong>🔥 {{ learner.streak.current }}</strong><span>серия</span></div><div class="metric"><strong>{{ learner.reviews_due }}</strong><span>ошибок</span></div></div>
        <div class="mt-5"><div class="mb-2 flex justify-between text-xs font-bold text-gray-500"><span>Выполнено назначений</span><span>{{ learner.assignments.completed }}/{{ learner.assignments.total }}</span></div><div class="h-2 overflow-hidden rounded-full bg-gray-100"><div class="h-full rounded-full bg-primary-500" :style="{width: completion(learner) + '%'}"></div></div></div>
        <div class="mt-4 flex items-center justify-between"><p class="text-xs text-gray-400">Последняя активность: {{ learner.last_activity_at ? new Date(learner.last_activity_at).toLocaleString('ru-RU') : 'ещё не занимался' }}</p><router-link :to="`/admin/learners/${learner.id}/history`" class="text-sm font-bold text-primary-600 dark:text-primary-300">История и назначения →</router-link></div>
      </article>
    </section>
  </div>
</template>
<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {learningApi, workspaceApi} from '@/api/learning'
import {useWorkspaceStore} from '@/stores/workspace'
import type {LearnerProgress} from '@/types/learning'
import PushNotificationPrompt from '@/components/learning/PushNotificationPrompt.vue'
const workspace = useWorkspaceStore(); const learners = ref<LearnerProgress[]>([]); const loading = ref(true)
const tutorEnabled = computed(() => workspace.current?.modules?.tutor === true)
onMounted(async () => { const current = await workspace.load(); if (current) learners.value = (await learningApi.progress(current.id)).learners; loading.value = false })
const completion = (learner: LearnerProgress) => learner.assignments.total ? Math.round(learner.assignments.completed / learner.assignments.total * 100) : 0
async function toggleTutor() { if (!workspace.current) return; const enabled = !tutorEnabled.value; await workspaceApi.updateModule(workspace.current.id, 'tutor', enabled); workspace.current.modules.tutor = enabled }
</script>
