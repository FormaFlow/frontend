<template>
  <div class="max-w-4xl">
    <div class="flex gap-4 items-center mb-6">
      <router-link to="/forms" class="text-primary-500 hover:underline">
        ← {{ $t('common.back') }}
      </router-link>
      <h1 class="text-2xl font-bold">{{ $t('forms.edit_form') }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader/>
    </div>
    <div v-else class="space-y-6">
      <!-- Basic Info -->
      <div class="card">
        <h2 class="text-xl font-bold mb-4">{{ $t('common.info') }}</h2>
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <AppInput
              v-model="form.name"
              :label="$t('forms.form_name')"
              required
              :error="errors.name"
          />
          <div class="form-group">
            <label class="form-label">{{ $t('forms.form_description') }}</label>
            <textarea v-model="form.description" class="form-textarea" rows="4"></textarea>
          </div>
          
          <div class="space-y-4 border-t pt-4">
            <div class="flex items-center gap-2">
              <input
                  id="is-quiz"
                  v-model="form.is_quiz"
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded"
              />
              <label for="is-quiz" class="text-sm font-medium">
                {{ $t('forms.is_quiz') }}
              </label>
            </div>

            <div v-if="form.is_quiz" class="form-group max-w-sm">
              <label for="reminder-interval" class="form-label">
                {{ $t('forms.reminder_interval') }}
              </label>
              <select
                  id="reminder-interval"
                  v-model="form.reminder_interval_minutes"
                  class="form-select"
              >
                <option :value="null">{{ $t('forms.reminder_disabled') }}</option>
                <option :value="120">{{ $t('forms.every_hours', { count: 2 }) }}</option>
                <option :value="360">{{ $t('forms.every_hours', { count: 6 }) }}</option>
                <option :value="720">{{ $t('forms.every_hours', { count: 12 }) }}</option>
                <option :value="1440">{{ $t('forms.every_days', { count: 1 }) }}</option>
                <option :value="2880">{{ $t('forms.every_days', { count: 2 }) }}</option>
                <option :value="4320">{{ $t('forms.every_days', { count: 3 }) }}</option>
                <option :value="10080">{{ $t('forms.every_days', { count: 7 }) }}</option>
              </select>
            </div>

            <div class="flex items-center gap-2">
              <input
                  id="single-submission"
                  v-model="form.single_submission"
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded"
              />
              <label for="single-submission" class="text-sm font-medium">
                {{ $t('forms.single_submission') }}
              </label>
            </div>

            <div class="flex items-center gap-2">
              <input
                  id="quick-entry-favorite"
                  v-model="form.quick_entry_favorite"
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded"
              />
              <label for="quick-entry-favorite" class="text-sm font-medium">
                {{ $t('forms.quick_entry_favorite') }}
              </label>
            </div>
          </div>
          
          <AppButton type="submit" :disabled="updateLoading">
            {{ updateLoading ? $t('common.loading') : $t('common.save') }}
          </AppButton>
        </form>
      </div>

      <!-- Fields Management -->
      <div class="card">
        <FormFieldBuilder
            v-if="currentForm"
            :fields="currentForm.fields || []"
            :form-id="currentForm.id"
            :is-quiz="form.is_quiz"
            @add-field="handleAddField"
            @update-field="handleUpdateField"
            @delete-field="handleDeleteField"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted} from 'vue'
import {useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from "pinia"
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import FormFieldBuilder from '@/components/forms/FormFieldBuilder.vue'
import {useForms} from '@/composables/useForms'
import {useFormsStore} from "@/stores/forms"
import {useUiStore} from "@/stores/ui"
import {useNotification} from '@/composables/useNotification'
import {formsApi} from "@/api/forms"
import {useForm} from "@/composables/useForm"
import type {ValidationRules} from '@/utils/validation'
import type {FormField} from "@/types/form"

const route = useRoute()
const { t } = useI18n()
const formsStore = useFormsStore()
const uiStore = useUiStore()
const {showSuccess} = useNotification()
const {currentForm, loading} = storeToRefs(formsStore)
const {fetchForm, updateForm} = useForms()

const rules: ValidationRules = {
  name: {required: true}
}

const {
  form,
  errors,
  loading: updateLoading,
  handleSubmit: handleUpdate,
  setData
} = useForm({
  initialState: {
    name: '',
    description: '',
    is_quiz: false,
    single_submission: false,
    quick_entry_favorite: false,
    reminder_interval_minutes: null as number | null
  },
  rules,
  onSubmit: async (formData) => {
    try {
      await updateForm(route.params.id as string, formData)
      showSuccess(t('forms.form_updated'))
    } catch (error: unknown) {
      uiStore.handleApiError(error)
    }
  }
})

const handleAddField = async (fieldData: Omit<FormField, 'id'>) => {
  if (!currentForm.value) return

  try {
    await formsApi.addField(currentForm.value.id, fieldData)
    await formsStore.fetchForm(currentForm.value.id)
    showSuccess(t('forms.field_added'))
  } catch (error: unknown) {
    uiStore.handleApiError(error)
  }
}

const handleUpdateField = async (field: FormField) => {
  if (!currentForm.value) return

  try {
    await formsApi.updateField(currentForm.value.id, field.id, field)
    await formsStore.fetchForm(currentForm.value.id)
    showSuccess(t('forms.form_updated'))
  } catch (error: unknown) {
    uiStore.handleApiError(error)
  }
}

const handleDeleteField = async (fieldId: string) => {
  if (!currentForm.value) return

  try {
    await formsApi.removeField(currentForm.value.id, fieldId)
    await formsStore.fetchForm(currentForm.value.id)
    showSuccess(t('forms.field_removed'))
  } catch (error: unknown) {
    uiStore.handleApiError(error)
  }
}

onMounted(async () => {
  await fetchForm(route.params.id as string)
  if (currentForm.value) {
    setData({
      name: currentForm.value.name,
      description: currentForm.value.description || '',
      is_quiz: currentForm.value.is_quiz || false,
      single_submission: currentForm.value.single_submission || false,
      quick_entry_favorite: currentForm.value.quick_entry_favorite || false,
      reminder_interval_minutes: currentForm.value.reminder_interval_minutes ?? null
    })
  }
})
</script>
