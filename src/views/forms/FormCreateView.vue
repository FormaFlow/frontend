<template>
  <div class="max-w-2xl">
    <div class="card">
      <h1 class="text-2xl font-bold mb-6">{{ $t('forms.create_form') }}</h1>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <AppInput
            v-model="form.name"
            :label="$t('forms.form_name')"
            :placeholder="$t('forms.form_name')"
            required
            :error="errors.name"
        />

        <div class="form-group">
          <label class="form-label">{{ $t('forms.form_description') }}</label>
          <textarea
              v-model="form.description"
              :placeholder="$t('forms.form_description')"
              class="form-textarea"
              rows="4"
          ></textarea>
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
              {{ $t('is_quiz') }}
            </label>
          </div>

          <div class="flex items-center gap-2">
            <input
                id="single-submission"
                v-model="form.single_submission"
                type="checkbox"
                class="w-4 h-4 text-primary-600 rounded"
            />
            <label for="single-submission" class="text-sm font-medium">
              {{ $t('single_submission') }}
            </label>
          </div>
        </div>

        <div class="flex gap-4">
          <AppButton type="submit" :disabled="loading">
            {{ loading ? $t('common.loading') : $t('common.create') }}
          </AppButton>
          <router-link to="/forms" class="btn-secondary">
            {{ $t('common.cancel') }}
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive} from 'vue'
import {useRouter} from 'vue-router'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import {useForms} from '@/composables/useForms'
import {validateForm, type ValidationRules} from '@/utils/validation'

const router = useRouter()
const {loading, createForm} = useForms()

const form = reactive({
  name: '',
  description: '',
  is_quiz: false,
  single_submission: false
})

const errors = reactive({
  name: ''
})

const rules: ValidationRules = {
  name: {required: true}
}

const handleSubmit = async () => {
  const validation = validateForm(form, rules)

  if (!validation.isValid) {
    Object.assign(errors, validation.errors)
    return
  }

  try {
    await createForm(form)
    await router.push('/forms')
  } catch (error) {
    console.error('Failed to create form:', error)
  }
}
</script>
