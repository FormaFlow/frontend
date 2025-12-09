<template>
  <div class="space-y-6">
    <div class="flex gap-4 items-center">
      <router-link to="/forms" class="text-primary-500 hover:underline">
        ← {{ $t('common.back') }}
      </router-link>
      <h1 class="text-3xl font-bold">{{ currentForm?.name }}</h1>
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
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import AppLoader from '@/components/common/AppLoader.vue'
import {useForms} from '@/composables/useForms'

const route = useRoute()
const {currentForm, loading, fetchForm, publishForm} = useForms()
const publishLoading = ref(false)

const handlePublish = async () => {
  if (!currentForm.value) return
  publishLoading.value = true
  try {
    await publishForm(currentForm.value.id)
  } finally {
    publishLoading.value = false
  }
}

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
