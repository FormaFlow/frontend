<template>
  <div class="space-y-6">
    <div class="flex gap-4 items-center justify-between">
      <div class="flex gap-4 items-center">
        <router-link to="/forms" class="text-primary-500 hover:underline">
          ← {{ $t('common.back') }}
        </router-link>
        <h1 class="text-3xl font-bold">{{ currentForm?.name }}</h1>
      </div>
      <button
          v-if="currentForm?.published"
          type="button"
          class="btn-secondary"
          @click="openShare"
      >
        🔗 {{ $t('forms.share') }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader/>
    </div>
    <div v-else-if="currentForm" class="space-y-6">
      <!-- Status -->
      <div class="card">
        <div class="flex items-center justify-between">
          <span :class="['badge', currentForm.published ? 'badge-success' : 'badge-warning']">
            {{ currentForm.published ? $t('forms.published') : $t('forms.draft') }}
          </span>
          <button
              v-if="!currentForm.published"
              type="button"
              class="btn-primary btn-sm"
              @click="handlePublish"
              :disabled="publishLoading"
          >
            {{ $t('forms.publish') }}
          </button>
        </div>
      </div>

      <!-- Description -->
      <div class="card">
        <p class="text-gray-700 dark:text-gray-300">{{ currentForm.description }}</p>
      </div>

      <!-- Fields -->
      <div class="card">
        <h2 class="text-xl font-bold mb-4">{{ $t('forms.field_name') }}</h2>
        <div v-if="currentForm.fields.length === 0" class="text-center py-8 text-gray-500">
          No fields yet
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead class="table-head">
            <tr>
              <th>{{ $t('forms.field_name') }}</th>
              <th>{{ $t('forms.field_type') }}</th>
              <th>{{ $t('forms.field_required') }}</th>
            </tr>
            </thead>
            <tbody class="table-body">
            <tr v-for="field in currentForm.fields" :key="field.id">
              <td>{{ field.label }}</td>
              <td>{{ field.type }}</td>
              <td>
                <span v-if="field.required" class="badge badge-success">Yes</span>
                <span v-else class="badge">No</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-4">
        <router-link :to="`/forms/${currentForm.id}/edit`" class="btn-primary">
          {{ $t('common.edit') }}
        </router-link>
        <router-link :to="`/entries?form_id=${currentForm.id}`" class="btn-secondary">
          {{ $t('entries.title') }}
        </router-link>
      </div>
    </div>

    <AppModal
        :is-open="shareOpen"
        :title="currentForm?.is_quiz ? $t('forms.assign_test') : $t('forms.share')"
        :confirm-text="currentForm?.is_quiz ? $t('forms.assign_test') : $t('forms.copy_link')"
        :cancel-text="$t('common.close')"
        max-width="max-w-lg"
        @close="shareOpen = false"
        @confirm="handleShareConfirm"
    >
      <div class="max-h-[65vh] space-y-5 overflow-y-auto px-0.5">
        <div class="flex min-w-0 gap-2">
          <input :value="shareLink" class="form-input min-w-0 flex-1" readonly />
          <button type="button" class="btn-secondary shrink-0" @click="copyLink">
            {{ $t('forms.copy_link') }}
          </button>
        </div>

        <template v-if="currentForm?.is_quiz">
          <div>
            <label for="recipient-search" class="form-label">{{ $t('forms.assign_recipients') }}</label>
            <input
                id="recipient-search"
                v-model.trim="recipientSearch"
                type="search"
                class="form-input"
                :placeholder="$t('forms.search_users')"
            />
          </div>

          <div v-if="searchLoading" class="flex justify-center py-3"><AppLoader /></div>
          <div v-else-if="recipientSearch.length >= 2" class="space-y-2">
            <label
                v-for="user in searchResults"
                :key="user.id"
                class="flex min-w-0 items-center gap-3 border-b border-gray-200 py-2 dark:border-gray-700"
            >
              <input
                  type="checkbox"
                  class="h-4 w-4 shrink-0"
                  :checked="selectedUserIds.includes(user.id) || assignedUserIds.has(user.id)"
                  :disabled="assignedUserIds.has(user.id)"
                  @change="toggleRecipient(user.id)"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium">{{ user.name }}</span>
                <span class="block truncate text-sm text-gray-500">{{ user.email }}</span>
              </span>
              <span v-if="assignedUserIds.has(user.id)" class="badge badge-success shrink-0">
                {{ $t('forms.assigned') }}
              </span>
            </label>
            <p v-if="searchResults.length === 0" class="py-3 text-sm text-gray-500">
              {{ $t('forms.no_users_found') }}
            </p>
          </div>

          <div v-if="assignments.length" class="border-t border-gray-200 pt-4 dark:border-gray-700">
            <p class="mb-2 text-sm font-medium">{{ $t('forms.assigned') }}</p>
            <div class="space-y-2">
              <div v-for="assignment in assignments" :key="assignment.id" class="flex min-w-0 items-center gap-2 text-sm">
                <span class="min-w-0 flex-1 truncate">{{ assignment.recipient.name }} · {{ assignment.recipient.email }}</span>
                <span :class="['badge shrink-0', assignment.completed_at ? 'badge-success' : 'badge-warning']">
                  {{ assignment.completed_at ? $t('forms.completed') : $t('forms.pending') }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import AppLoader from '@/components/common/AppLoader.vue'
import AppModal from '@/components/common/AppModal.vue'
import {useForms} from '@/composables/useForms'
import {useNotification} from '@/composables/useNotification'
import {useI18n} from 'vue-i18n'
import {remindersApi, type QuizAssignment, type ReminderUser} from '@/api/reminders'

const route = useRoute()
const {t} = useI18n()
const {showSuccess} = useNotification()
const {currentForm, loading, fetchForm, publishForm} = useForms()
const publishLoading = ref(false)
const shareOpen = ref(false)
const recipientSearch = ref('')
const searchResults = ref<ReminderUser[]>([])
const assignments = ref<QuizAssignment[]>([])
const selectedUserIds = ref<string[]>([])
const searchLoading = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

const shareLink = computed(() => {
  if (!currentForm.value) return ''
  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  const backendBase = apiBase.replace(/\/api(\/v1)?\/?$/, '')
  return `${backendBase}/shared/${currentForm.value.id}`
})
const assignedUserIds = computed(() => new Set(assignments.value.map(item => item.recipient.id)))

const handlePublish = async () => {
  if (!currentForm.value) return
  publishLoading.value = true
  try {
    await publishForm(currentForm.value.id)
    showSuccess(t('forms.form_published'))
  } finally {
    publishLoading.value = false
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    showSuccess(t('forms.link_copied'))
  } catch (err) {
    console.error('Failed to copy link', err)
  }
}

const openShare = async () => {
  shareOpen.value = true
  selectedUserIds.value = []
  if (currentForm.value?.is_quiz) {
    const response = await remindersApi.listAssignments(currentForm.value.id)
    assignments.value = response.assignments
  }
}

const toggleRecipient = (userId: string) => {
  selectedUserIds.value = selectedUserIds.value.includes(userId)
    ? selectedUserIds.value.filter(id => id !== userId)
    : [...selectedUserIds.value, userId]
}

const handleShareConfirm = async () => {
  if (!currentForm.value?.is_quiz) {
    await copyLink()
    shareOpen.value = false
    return
  }
  if (selectedUserIds.value.length === 0) return

  const response = await remindersApi.assign(currentForm.value.id, selectedUserIds.value)
  const assignmentById = new Map(assignments.value.map(item => [item.id, item]))
  response.assignments.forEach(item => assignmentById.set(item.id, item))
  assignments.value = [...assignmentById.values()]
  selectedUserIds.value = []
  showSuccess(t('forms.test_assigned'))
}

watch(recipientSearch, query => {
  if (searchTimer) clearTimeout(searchTimer)
  if (query.length < 2) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searchLoading.value = true
    try {
      const response = await remindersApi.searchUsers(query)
      if (recipientSearch.value === query) searchResults.value = response.users
    } finally {
      searchLoading.value = false
    }
  }, 250)
})

const loadFormData = async () => {
  const formId = route.params.id as string

  if (!formId) {
    console.error('No form ID provided!')
    return
  }

  await fetchForm(formId)
}

onMounted(async () => {
  await loadFormData()
})

watch(() => route.params.id, () => {
  loadFormData()
})
</script>
