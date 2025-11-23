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
            @add-field="handleAddField"
            @update-field="handleUpdateField"
            @delete-field="handleDeleteField"
        />
      </div>
<!--      <div class="card">-->
<!--        <h2 class="text-xl font-bold mb-4">{{ $t('forms.field_name') }}</h2>-->
<!--        <div v-if="currentForm?.fields" class="space-y-4">-->
<!--          <div v-for="(field, idx) in currentForm.fields" :key="field.id" class="p-4 border rounded-lg">-->
<!--            <div class="flex justify-between items-start">-->
<!--              <div>-->
<!--                <p class="font-medium">{{ field.label }}</p>-->
<!--                <p class="text-sm text-gray-600 dark:text-gray-400">{{ field.type }}</p>-->
<!--              </div>-->
<!--              <button type="button" class="btn-danger btn-sm" @click="removeField(field.id)">-->
<!--                {{ $t('common.delete') }}-->
<!--              </button>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import {useForms} from '@/composables/useForms'
import {validateForm, type ValidationRules} from '@/utils/validation'
import {storeToRefs} from "pinia";
import {useFormsStore} from "@/stores/forms";
import FormFieldBuilder from "@/components/forms/FormFieldBuilder.vue";

const route = useRoute()
const router = useRouter()
const {currentForm, loading} = storeToRefs(useFormsStore())
const {fetchForm, updateForm} = useForms()

const form = reactive({
  name: '',
  description: ''
})

const errors = reactive({
  name: ''
})

const updateLoading = reactive({value: false})

const rules: ValidationRules = {
  name: {required: true}
}

const handleUpdate = async () => {
  const validation = validateForm(form, rules)
  if (!validation.isValid) {
    Object.assign(errors, validation.errors)
    return
  }

  updateLoading.value = true
  try {
    await updateForm(route.params.id as string, form)
    await router.push('/forms')
  } finally {
    updateLoading.value = false
  }
}

const removeField = (fieldId: string) => {
  if (confirm('Remove this field?') && currentForm.value) {
    const idx = currentForm.value.fields.findIndex(f => f.id === fieldId)
    if (idx !== -1) {
      currentForm.value.fields.splice(idx, 1)
    }
  }
}

onMounted(async () => {
  await fetchForm(route.params.id as string)
  if (currentForm.value) {
    form.name = currentForm.value.name
    form.description = currentForm.value.description || ''
  }
})
</script>
