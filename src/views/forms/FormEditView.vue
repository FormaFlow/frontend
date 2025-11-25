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
          <AppButton type="submit" :disabled="updateLoading.value">
            {{ updateLoading.value ? $t('common.loading') : $t('common.save') }}
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
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {storeToRefs} from "pinia"
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import FormFieldBuilder from '@/components/forms/FormFieldBuilder.vue'
import {useForms} from '@/composables/useForms'
import {useFormsStore} from "@/stores/forms"
import {useUiStore} from "@/stores/ui"
import {formsApi} from "@/api/forms"
import {validateForm, type ValidationRules} from '@/utils/validation'
import type {FormField} from "@/types/form"

const route = useRoute()
const router = useRouter()
const formsStore = useFormsStore()
const uiStore = useUiStore()
const {currentForm, loading} = storeToRefs(formsStore)
const {fetchForm, updateForm} = useForms()

console.log('CURRENT_FORM')
console.log(currentForm)

const form = reactive({
  name: '',
  description: ''
})

const errors = reactive({
  name: ''
})

const updateLoading = ref(false)

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
    uiStore.addNotification({
      type: 'success',
      message: 'Форма обновлена'
    })
  } catch (error: any) {
    uiStore.addNotification({
      type: 'error',
      message: error.message || 'Ошибка обновления формы'
    })
  } finally {
    updateLoading.value = false
  }
}

const handleAddField = async (fieldData: Omit<FormField, 'id'>) => {
  if (!currentForm.value) return

  console.log('Adding field:', fieldData)

  try {
    const response = await formsApi.addField(currentForm.value.id, fieldData)
    console.log('Field added response:', response)

    await formsStore.fetchForm(currentForm.value.id)

    uiStore.addNotification({
      type: 'success',
      message: 'Поле добавлено'
    })
  } catch (error: any) {
    console.error('Error adding field:', error)
    uiStore.addNotification({
      type: 'error',
      message: error.message || 'Ошибка добавления поля'
    })
  }
}

const handleUpdateField = async (field: FormField) => {
  if (!currentForm.value) return

  console.log('Updating field:', field)

  try {
    const idx = currentForm.value.fields.findIndex(f => f.id === field.id)
    if (idx !== -1) {
      currentForm.value.fields[idx] = field
    }

    uiStore.addNotification({
      type: 'success',
      message: 'Поле обновлено'
    })
  } catch (error: any) {
    console.error('Error updating field:', error)
    uiStore.addNotification({
      type: 'error',
      message: error.message || 'Ошибка обновления поля'
    })
  }
}

const handleDeleteField = async (fieldId: string) => {
  if (!currentForm.value) return

  console.log('Deleting field:', fieldId)

  try {
    await formsApi.removeField(currentForm.value.id, fieldId)
    await formsStore.fetchForm(currentForm.value.id)

    uiStore.addNotification({
      type: 'success',
      message: 'Поле удалено'
    })
  } catch (error: any) {
    console.error('Error deleting field:', error)
    uiStore.addNotification({
      type: 'error',
      message: error.message || 'Ошибка удаления поля'
    })
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
