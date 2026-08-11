<template>
  <div class="space-y-4">
    <AppInput
      v-model="fieldForm.label"
      :label="$t('forms.field_label')"
      :required="true"
      :placeholder="$t('forms.enter_field_name')"
      id="field-label"
    />

    <AppSelect
      v-model="fieldForm.type"
      :label="$t('forms.field_type')"
      :required="true"
      :options="fieldTypeOptions"
      id="field-type"
    />

    <AppInput
      v-if="['number', 'currency'].includes(fieldForm.type)"
      v-model="fieldForm.unit"
      :label="$t('forms.field_unit')"
      placeholder="kg, m, $, etc."
      id="field-unit"
    />

    <AppInput
      v-model="fieldForm.placeholder"
      :label="$t('forms.field_placeholder')"
      :placeholder="$t('forms.enter_placeholder')"
      id="field-placeholder"
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

    <div v-if="isQuiz" class="space-y-4 border-t pt-4 mt-4">
      <AppInput
        v-model="fieldForm.correctAnswer"
        :label="$t('forms.correct_answer')"
        :placeholder="$t('forms.correct_answer')"
        id="field-correct-answer"
      />
      <AppInput
        v-model.number="fieldForm.points"
        type="number"
        :label="$t('forms.points')"
        placeholder="0"
        id="field-points"
      />
    </div>

    <!-- Options for Select -->
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
          :placeholder="$t('forms.option_label')"
          class="form-input flex-1"
        />
        <input
          v-model="option.value"
          type="text"
          :placeholder="$t('forms.option_value')"
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
        + {{ $t('forms.add_option') }}
      </button>

      <label class="flex items-start gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
        <input
          id="field-sum-values"
          v-model="fieldForm.sum_values"
          type="checkbox"
          class="mt-0.5 h-4 w-4 rounded text-primary-600"
        />
        <span>
          <span class="block text-sm font-medium">{{ $t('forms.sum_values') }}</span>
          <span class="block text-xs text-gray-500 dark:text-gray-400">{{ $t('forms.sum_values_hint') }}</span>
        </span>
      </label>
    </div>

    <AppSelect
      v-if="isStatNumeric"
      id="field-trend-direction"
      v-model="fieldForm.trend_direction"
      :label="$t('forms.trend_direction')"
      :options="trendDirectionOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import type { FormField } from '@/types/form'

const { t } = useI18n()

// We use a subset of FormField for the editing state
type EditableField = Omit<FormField, 'id' | 'order'> & { id?: string, order?: number }

// Internal state needs strict types for v-model binding
interface LocalEditableField extends Omit<EditableField, 'unit' | 'placeholder' | 'correctAnswer' | 'points' | 'order'> {
  id?: string
  unit: string
  placeholder: string
  correctAnswer: string
  points: number
  sum_values: boolean
  trend_direction: 'neutral' | 'increase_good' | 'decrease_good'
  order: number
}

const props = defineProps<{
  modelValue: EditableField
  isQuiz?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: EditableField]
}>()

// Local state copy to avoid mutating prop directly
const fieldForm = ref<LocalEditableField>({
  ...props.modelValue,
  unit: props.modelValue.unit ?? '',
  placeholder: props.modelValue.placeholder ?? '',
  correctAnswer: props.modelValue.correctAnswer ?? '',
  points: props.modelValue.points ?? 0,
  sum_values: props.modelValue.sum_values ?? false,
  trend_direction: props.modelValue.trend_direction ?? 'neutral',
  order: props.modelValue.order ?? 0,
  options: props.modelValue.options ? JSON.parse(JSON.stringify(props.modelValue.options)) : []
})

// We watch the prop ONLY to reset the local state when the modal is opened/switched
watch(() => props.modelValue.id, () => {
  fieldForm.value = {
    ...props.modelValue,
    unit: props.modelValue.unit ?? '',
    placeholder: props.modelValue.placeholder ?? '',
    correctAnswer: props.modelValue.correctAnswer ?? '',
    points: props.modelValue.points ?? 0,
    sum_values: props.modelValue.sum_values ?? false,
    trend_direction: props.modelValue.trend_direction ?? 'neutral',
    order: props.modelValue.order ?? 0,
    options: props.modelValue.options ? JSON.parse(JSON.stringify(props.modelValue.options)) : []
  }
})

watch(() => fieldForm.value.type, type => {
  if (type !== 'select') {
    fieldForm.value.sum_values = false
  }
})

const isStatNumeric = computed(() =>
  ['number', 'currency'].includes(fieldForm.value.type)
  || (fieldForm.value.type === 'select' && fieldForm.value.sum_values)
)

watch(isStatNumeric, enabled => {
  if (!enabled) fieldForm.value.trend_direction = 'neutral'
})

// We expose the current state so the parent can read it when saving
defineExpose({
  getValue: () => ({ ...fieldForm.value })
})

// Remove all watchers that emit update:modelValue
// ... rest of the component ...


const fieldTypeOptions = computed(() => [
  { label: t('forms.field_types.text'), value: 'text' },
  { label: t('forms.field_types.textarea'), value: 'textarea' },
  { label: t('forms.field_types.number'), value: 'number' },
  { label: t('forms.field_types.email'), value: 'email' },
  { label: t('forms.field_types.date'), value: 'date' },
  { label: t('forms.field_types.select'), value: 'select' },
  { label: t('forms.field_types.boolean'), value: 'boolean' },
  { label: t('forms.field_types.currency'), value: 'currency' }
])

const trendDirectionOptions = computed(() => [
  {label: t('forms.trend_directions.neutral'), value: 'neutral'},
  {label: t('forms.trend_directions.increase_good'), value: 'increase_good'},
  {label: t('forms.trend_directions.decrease_good'), value: 'decrease_good'},
])

const addOption = () => {
  if (!fieldForm.value.options) {
    fieldForm.value.options = []
  }
  fieldForm.value.options.push({ label: '', value: '' })
}

const removeOption = (index: number) => {
  if (fieldForm.value.options) {
    fieldForm.value.options.splice(index, 1)
  }
}
</script>
