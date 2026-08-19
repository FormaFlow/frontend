<template>
  <div class="admin-shell">
    <header class="admin-heading">
      <div>
        <router-link to="/admin" class="text-sm font-bold text-gray-500 dark:text-gray-300">← Прогресс учеников</router-link>
        <p class="eyebrow mt-4 text-primary-600">История и назначения</p>
        <h1 class="mt-2 text-3xl font-black">{{ learner?.name || 'Ученик' }}</h1>
        <p class="mt-2 text-gray-500 dark:text-gray-300">Здесь видны все назначения и каждая попытка. Завершённый тест можно открыть для пересдачи без потери истории.</p>
      </div>
      <router-link v-if="workspace.isManager" to="/admin/assignments" class="btn-primary">Назначить ещё</router-link>
    </header>

    <p v-if="message" class="rounded-2xl bg-green-50 p-4 font-bold text-green-800 dark:bg-green-950/50 dark:text-green-100">{{ message }}</p>
    <p v-if="error" class="rounded-2xl bg-red-50 p-4 font-bold text-red-800 dark:bg-red-950/50 dark:text-red-100">{{ error }}</p>
    <div v-if="loading" class="card text-center">Загружаю историю…</div>
    <div v-else-if="!assignments.length" class="empty-learning">
      <div class="text-5xl">🗓️</div><h2 class="mt-3 text-xl font-black">Назначений пока нет</h2>
      <router-link v-if="workspace.isManager" to="/admin/assignments" class="btn-primary mt-5 inline-block">Назначить тест</router-link>
    </div>

    <section v-else class="space-y-5">
      <article v-for="assignment in assignments" :key="assignment.id" class="card">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><p class="text-sm font-bold text-primary-600 dark:text-primary-300">{{ subjectName(assignment.subject_code) }}</p><h2 class="mt-1 text-xl font-black">{{ assignment.assessment_title }}</h2><p class="mt-2 text-sm text-gray-500 dark:text-gray-300">Назначен {{ dateTime(assignment.assigned_at) }}<span v-if="assignment.due_at"> · срок {{ dateTime(assignment.due_at) }}</span></p></div>
          <span class="badge" :class="statusClass(assignment.status)">{{ statusName(assignment.status) }}</span>
        </div>

        <div v-if="workspace.isManager" class="mt-5 rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/50">
          <p class="mb-3 text-sm font-black">Редактировать назначение</p>
          <div class="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label><span class="form-label">Ученик</span><select v-model="edits[assignment.id].learner_user_id" class="form-select" :disabled="assignment.attempts.length > 0"><option v-for="item in learners" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
            <label><span class="form-label">Выполнить до</span><input v-model="edits[assignment.id].due_at" type="datetime-local" class="form-input"></label>
            <button class="btn-secondary" :disabled="busy === assignment.id" @click="save(assignment)">Сохранить</button>
          </div>
          <p v-if="assignment.attempts.length" class="mt-2 text-xs text-gray-500 dark:text-gray-400">Ученика нельзя менять после начала теста: так история останется достоверной.</p>
        </div>

        <div class="mt-5">
          <h3 class="text-sm font-black uppercase tracking-wide text-gray-500 dark:text-gray-300">Попытки: {{ assignment.attempts.length }}</h3>
          <div v-if="assignment.attempts.length" class="mt-3 divide-y divide-gray-200 rounded-2xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            <div v-for="(attempt, index) in assignment.attempts" :key="attempt.id" class="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <span class="font-bold">Попытка {{ assignment.attempts.length - index }} · {{ dateTime(attempt.completed_at || attempt.started_at) }}</span>
              <span v-if="attempt.status === 'completed' && attempt.score !== null" class="font-black">{{ attempt.score }}/{{ attempt.max_points }} · {{ percent(attempt.score, attempt.max_points) }}%</span>
              <span v-else class="badge badge-warning">В процессе</span>
            </div>
          </div>
          <p v-else class="mt-2 text-sm text-gray-500 dark:text-gray-300">Ученик ещё не открывал этот тест.</p>
        </div>

        <div v-if="workspace.isManager" class="mt-5 flex flex-wrap gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
          <button v-if="assignment.status === 'completed'" class="btn-primary" :disabled="busy === assignment.id" @click="reopen(assignment)">Назначить пересдачу</button>
          <button v-if="assignment.attempts.length === 0" class="btn-danger" :disabled="busy === assignment.id" @click="remove(assignment)">Удалить назначение</button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, reactive, ref} from 'vue'
import {useRoute} from 'vue-router'
import {learningApi, workspaceApi} from '@/api/learning'
import {useWorkspaceStore} from '@/stores/workspace'
import type {LearnerProgress, LearningAssignmentHistory} from '@/types/learning'

type Learner = {id: string; name: string; target_grade: number}
const route = useRoute()
const workspace = useWorkspaceStore()
const learners = ref<Learner[]>([])
const progress = ref<LearnerProgress[]>([])
const assignments = ref<LearningAssignmentHistory[]>([])
const edits = reactive<Record<string, {learner_user_id: string; due_at: string}>>({})
const loading = ref(true)
const busy = ref('')
const message = ref('')
const error = ref('')
const learnerId = computed(() => String(route.params.learnerId))
const learner = computed(() => progress.value.find(item => item.id === learnerId.value))

onMounted(load)

async function load() {
  const current = await workspace.load()
  if (!current) return
  loading.value = true
  try {
    const [summary, learnerList, timeline] = await Promise.all([
      learningApi.progress(current.id),
      workspace.isManager ? workspaceApi.learners(current.id) : Promise.resolve({learners: []}),
      learningApi.timeline(current.id, learnerId.value)
    ])
    progress.value = summary.learners
    learners.value = learnerList.learners
    assignments.value = timeline.assignments
    for (const assignment of assignments.value) edits[assignment.id] = {learner_user_id: learnerId.value, due_at: inputDate(assignment.due_at)}
  } finally { loading.value = false }
}

async function save(assignment: LearningAssignmentHistory) {
  if (!workspace.current) return
  await act(assignment.id, async () => {
    const edit = edits[assignment.id]
    await learningApi.updateAssignment(workspace.current!.id, assignment.id, {
      learner_user_id: edit.learner_user_id,
      due_at: edit.due_at ? new Date(edit.due_at).toISOString() : null
    })
    message.value = edit.learner_user_id === learnerId.value ? 'Назначение обновлено.' : 'Назначение перенесено другому ученику.'
    await load()
  })
}

async function reopen(assignment: LearningAssignmentHistory) {
  if (!workspace.current || !window.confirm('Назначить этот тест ещё раз? Прошлые попытки сохранятся.')) return
  await act(assignment.id, async () => { await learningApi.reopenAssignment(workspace.current!.id, assignment.id); message.value = 'Пересдача появилась в плане ученика.'; await load() })
}

async function remove(assignment: LearningAssignmentHistory) {
  if (!workspace.current || !window.confirm('Удалить это непройденное назначение?')) return
  await act(assignment.id, async () => { await learningApi.deleteAssignment(workspace.current!.id, assignment.id); message.value = 'Назначение удалено.'; await load() })
}

async function act(id: string, action: () => Promise<void>) {
  busy.value = id; error.value = ''; message.value = ''
  try { await action() } catch (caught) { error.value = (caught as Error).message } finally { busy.value = '' }
}
function inputDate(value?: string | null) { if (!value) return ''; const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16) }
function dateTime(value: string) { return new Date(value).toLocaleString('ru-RU', {dateStyle: 'medium', timeStyle: 'short'}) }
function percent(score: number, max: number) { return max ? Math.round(score / max * 100) : 0 }
function subjectName(code: string) { return ({math: 'Математика', russian: 'Русский язык'} as Record<string, string>)[code] || code }
function statusName(status: string) { return ({assigned: 'Назначен', in_progress: 'В процессе', completed: 'Завершён'} as Record<string, string>)[status] || status }
function statusClass(status: string) { return status === 'completed' ? 'badge-success' : status === 'in_progress' ? 'badge-warning' : 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100' }
</script>
