<template>
  <div v-if="!fields || fields.length === 0" class="card text-center py-12">
    <p class="text-gray-600 dark:text-gray-400">
      {{ $t('forms.no_fields') }}
    </p>
  </div>

  <div v-else class="space-y-4">
    <div
      v-for="(field, index) in fields"
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
              {{ $t('forms.required') }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ $t(`forms.field_types.${field.type}`) }}
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
            @click="$emit('move', index, 'up')"
            title="Переместить вверх"
          >
            ↑
          </button>
          <button
            type="button"
            class="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30"
            :disabled="index === fields.length - 1"
            @click="$emit('move', index, 'down')"
            title="Переместить вниз"
          >
            ↓
          </button>

          <!-- Кнопка редактирования -->
          <button
            type="button"
            class="p-2 text-blue-600 hover:text-blue-800"
            @click="$emit('edit', field)"
            title="Редактировать"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
              />
            </svg>
          </button>

          <!-- Кнопка удаления -->
          <button
            type="button"
            class="p-2 text-red-600 hover:text-red-800"
            @click="$emit('delete', field)"
            title="Удалить"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormField } from '@/types/form'

defineProps<{
  fields: FormField[]
}>()

defineEmits<{
  move: [index: number, direction: 'up' | 'down']
  edit: [field: FormField]
  delete: [field: FormField]
}>()
</script>
