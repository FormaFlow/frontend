<template>
  <div class="form-group">
    <label v-if="label" :for="selectId" class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <select
        :id="selectId"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        :class="[
        'form-select',
        error && 'border-red-500 focus:ring-red-500'
      ]"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder || 'Select an option' }}</option>
      <option v-for="item in options" :key="item.value" :value="item.value">
        {{ item.label }}
      </option>
    </select>
    <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'

interface Option {
  label: string
  value: string | number | boolean
}

interface Props {
  modelValue: string | number | boolean
  label?: string
  placeholder?: string
  options: Option[]
  required?: boolean
  disabled?: boolean
  error?: string
}

withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectId = computed(() => Math.random().toString(36).substr(2, 9))
</script>
