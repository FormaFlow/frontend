<template>
  <div class="space-y-6">
    <!-- Заголовок секции -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold">{{ $t('forms.field_name') }}</h2>
      <button
        type="button"
        class="btn btn-primary"
        @click="openAddModal"
      >
        {{ $t('forms.add_field') }}
      </button>
    </div>

    <!-- Список полей -->
    <FieldList
      :fields="sortedFields"
      @move="moveField"
      @edit="openEditModal"
      @delete="confirmDeleteField"
    />

    <!-- Модальное окно добавления/редактирования поля -->
    <AppModal
      :is-open="showModal"
      :title="editingFieldId ? $t('forms.edit_field') : $t('forms.add_field')"
      :confirm-text="$t('common.save')"
      :cancel-text="$t('common.cancel')"
      @close="closeModal"
      @confirm="saveField"
    >
      <FieldEditor
        ref="editorRef"
        :model-value="currentField"
        :is-quiz="isQuiz"
      />
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import FieldList from './builder/FieldList.vue'
import FieldEditor from './builder/FieldEditor.vue'
import type { FormField, FormFieldOption, FormFieldType } from '@/types/form'

interface Props {
  fields: FormField[]
  formId?: string
  isQuiz?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'add-field': [field: Omit<FormField, 'id'>]
  'update-field': [field: FormField]
  'delete-field': [fieldId: string]
}>()

const sortedFields = computed(() => {
  if (!props.fields || !Array.isArray(props.fields)) {
    return []
  }
  return [...props.fields].sort((a, b) => a.order - b.order)
})

const showModal = ref(false)
const editingFieldId = ref<string | null>(null)
const editorRef = ref<InstanceType<typeof FieldEditor> | null>(null)

// Initial state for a new field
const defaultFieldState = {
  label: '',
  type: 'text' as FormFieldType,
  required: false,
  placeholder: '',
  unit: '',
  options: [] as FormFieldOption[],
  correctAnswer: '',
  points: 0,
  order: 0
}

const currentField = ref<Omit<FormField, 'id' | 'order'> & { id?: string, order?: number }>({ ...defaultFieldState })

const openAddModal = () => {
  editingFieldId.value = null
  currentField.value = { ...defaultFieldState, id: 'new-' + Date.now() } // Temp ID to trigger reset in editor
  showModal.value = true
}

const openEditModal = (field: FormField) => {
  editingFieldId.value = field.id
  currentField.value = { ...field, options: field.options ? [...field.options] : [] }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingFieldId.value = null
  currentField.value = { ...defaultFieldState }
}

const closeModalAfterSuccess = () => {
  closeModal()
}

defineExpose({
  closeModalAfterSuccess
})

const saveField = () => {
  const editorValue = editorRef.value?.getValue()
  if (!editorValue) return

  if (editingFieldId.value) {
    // Updating existing field
    const fieldToUpdate = {
      ...editorValue,
      id: editingFieldId.value,
      order: editorValue.order ?? 0 // Preserve order
    } as FormField
    emit('update-field', fieldToUpdate)
  } else {
    // Adding new field
    const newField = {
      ...editorValue,
      order: props.fields?.length ?? 0
    }
    // Remove temp ID if any
    if (newField.id?.startsWith('new-')) delete newField.id
    
    emit('add-field', newField as Omit<FormField, 'id'>)
  }
}

const confirmDeleteField = (field: FormField) => {
  if (confirm(`Delete field "${field.label}"?`)) { // Localization can be added here
    emit('delete-field', field.id)
  }
}

const moveField = (index: number, direction: 'up' | 'down') => {
  const newFields = [...sortedFields.value]
  const targetIndex = direction === 'up' ? index - 1 : index + 1

  if (targetIndex < 0 || targetIndex >= newFields.length) return

  const temp = newFields[index]
  newFields[index] = newFields[targetIndex]
  newFields[targetIndex] = temp

  // Update order for swapped fields
  newFields[index].order = index
  newFields[targetIndex].order = targetIndex

  emit('update-field', newFields[index])
  emit('update-field', newFields[targetIndex])
}
</script>