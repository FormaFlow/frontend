<template>
  <div class="form-group">
    <div class="flex items-center">
      <input
          :id="inputId"
          type="checkbox"
          :checked="modelValue"
          :disabled="disabled"
          class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 transition-colors duration-200 cursor-pointer"
          @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <label v-if="label" :for="inputId" class="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </label>
    </div>
    <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
    <p v-if="hint" class="text-gray-500 dark:text-gray-400 text-sm mt-1">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'

const props = defineProps<{
  modelValue: boolean
  label?: string
  error?: string
  id?: string
  required?: boolean
  disabled?: boolean
  hint?: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const inputId = computed(() => props.id || Math.random().toString(36).substr(2, 9))
</script>
