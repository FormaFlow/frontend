<template>
  <div class="form-group">
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
        :id="inputId"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :class="[
        'form-input',
        error && 'border-red-500 focus:ring-red-500'
      ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
    <p v-if="hint" class="text-gray-500 dark:text-gray-400 text-sm mt-1">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'

const props = defineProps<{
  modelValue: string | number
  label?: string
  type?: string
  placeholder?: string
  error?: string
  id?: string
  required?: boolean
  disabled?: boolean
  hint?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = computed(() => props.id || Math.random().toString(36).substr(2, 9))
</script>
