<template>
  <div class="space-y-6">
    <!-- Заголовок секции -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold">{{ $t('forms.field_name') }}</h2>
      <button
          type="button"
          class="btn btn-primary"
          @click="showAddFieldModal = true"
      >
        {{ $t('forms.add_field') }}
      </button>
    </div>

    <!-- Список полей -->
    <div v-if="!fields || fields.length === 0" class="card text-center py-12">
      <p class="text-gray-600 dark:text-gray-400">
        Поля не добавлены. Нажмите "Добавить поле" чтобы начать.
      </p>
    </div>

    <div v-else class="space-y-4">
      <div
          v-for="(field, index) in sortedFields"
          :key="field.id"
          class="card hover:shadow-lg transition"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-lg font-semibold">{{ field.label }}</h3>
              <span
                  v-if="field.required"
                  class="badge badge-danger text-xs"
              >
                Обязательное
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Тип: {{ $t(`forms.fieldtypes.${field.type}`) }} • Имя: {{ field.name }}
            </p>
            <p v-if="field.description" class="text-sm text-gray-500 mt-1">
              {{ field.description }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <!-- Кнопки перемещения -->
            <button
                type="button"
                class="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                :disabled="index === 0"
                @click="moveField(index, 'up')"
                title="Переместить вверх"
            >
              ↑
            </button>
            <button
                type="button"
                class="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                :disabled="index === fields.length - 1"
                @click="moveField(index, 'down')"
                title="Переместить вниз"
            >
              ↓
            </button>

            <!-- Кнопка редактирования -->
            <button
                type="button"
                class="p-2 text-blue-600 hover:text-blue-800"
                @click="editField(field)"
                title="Редактировать"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                    d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
            </button>

            <!-- Кнопка удаления -->
            <button
                type="button"
                class="p-2 text-red-600 hover:text-red-800"
                @click="confirmDeleteField(field)"
                title="Удалить"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления/редактирования поля -->
    <AppModal
        :is-open="showAddFieldModal"
        :title="editingField ? 'Редактировать поле' : $t('forms.add_field')"
        confirm-text="Сохранить"
        cancel-text="Отмена"
        @close="closeFieldModal"
        @confirm="saveField"
    >
      <div class="space-y-4">
        <AppInput
            v-model="fieldForm.label"
            :label="$t('forms.field_label')"
            :required="true"
            placeholder="Введите название поля"
        />

        <AppInput
            v-model="fieldForm.name"
            :label="$t('forms.field_name')"
            :required="true"
            placeholder="field_name"
            hint="Используйте только латинские буквы, цифры и подчеркивание"
        />

        <AppSelect
            v-model="fieldForm.type"
            :label="$t('forms.field_type')"
            :required="true"
            :options="fieldTypeOptions"
        />

        <AppInput
            v-model="fieldForm.placeholder"
            :label="$t('forms.field_placeholder')"
            placeholder="Текст-подсказка"
        />

        <div class="flex items-center gap-2">
          <input
              id="field-required"
              v-model="fieldForm.required"
              type="checkbox"
              class="w-4 h-4 text-primary-600 rounded"
          />
          <label for="field-required" class="text-sm">
            {{ $t('forms.field_required') }}
          </label>
        </div>

        <!-- Дополнительные поля для select -->
        <div v-if="fieldForm.type === 'select'" class="space-y-2">
          <label class="block text-sm font-medium">
            {{ $t('forms.field_options') }}
          </label>
          <div
              v-for="(option, idx) in fieldForm.options"
              :key="idx"
              class="flex gap-2"
          >
            <input
                v-model="option.label"
                type="text"
                placeholder="Название"
                class="form-input flex-1"
            />
            <input
                v-model="option.value"
                type="text"
                placeholder="Значение"
                class="form-input flex-1"
            />
            <button
                type="button"
                class="btn btn-secondary"
                @click="removeOption(idx)"
            >
              ×
            </button>
          </div>
          <button
              type="button"
              class="btn btn-secondary w-full"
              @click="addOption"
          >
            + Добавить опцию
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import type {FormField, FormFieldOption} from '@/types/form'

const {t} = useI18n()

interface Props {
  fields: FormField[]
  formId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: FormField[]]
  'add-field': [field: Omit<FormField, 'id'>]
  'update-field': [field: FormField]
  'delete-field': [fieldId: string]
}>()

const fields = computed(() => props.fields)
const sortedFields = computed(() =>
    [...fields.value].sort((a, b) => a.order - b.order)
)

const showAddFieldModal = ref(false)
const editingField = ref<FormField | null>(null)

const fieldForm = ref({
  label: '',
  name: '',
  type: 'text' as any,
  required: false,
  placeholder: '',
  options: [] as FormFieldOption[]
})

const fieldTypeOptions = [
  {label: 'Текст', value: 'text'},
  {label: 'Число', value: 'number'},
  {label: 'Email', value: 'email'},
  {label: 'Дата', value: 'date'},
  {label: 'Выпадающий список', value: 'select'},
  {label: 'Да/Нет', value: 'boolean'},
  {label: 'Валюта', value: 'currency'}
]

const editField = (field: FormField) => {
  editingField.value = field
  fieldForm.value = {
    label: field.label,
    name: field.name,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder || '',
    options: field.options ? [...field.options] : []
  }
  showAddFieldModal.value = true
}

const closeFieldModal = () => {
  showAddFieldModal.value = false
  editingField.value = null
  fieldForm.value = {
    label: '',
    name: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: []
  }
}

const saveField = () => {
  const fieldData = {
    ...fieldForm.value,
    order: editingField.value?.order ?? (fields?.value?.length ?? 0)
  }

  if (editingField.value) {
    emit('update-field', {
      ...editingField.value,
      ...fieldData
    })
  } else {
    emit('add-field', fieldData)
  }

  closeFieldModal()
}

const confirmDeleteField = (field: FormField) => {
  if (confirm(`Удалить поле "${field.label}"?`)) {
    emit('delete-field', field.id)
  }
}

const moveField = (index: number, direction: 'up' | 'down') => {
  const newFields = [...sortedFields.value]
  const targetIndex = direction === 'up' ? index - 1 : index + 1

  const temp = newFields[index]
  newFields[index] = newFields[targetIndex]
  newFields[targetIndex] = temp

  newFields.forEach((field, idx) => {
    field.order = idx
  })

  emit('update:modelValue', newFields)
}

const addOption = () => {
  fieldForm.value.options.push({label: '', value: ''})
}

const removeOption = (index: number) => {
  fieldForm.value.options.splice(index, 1)
}
</script>
