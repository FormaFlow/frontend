<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="$emit('close')"
    >
      <div class="card m-4 max-w-md w-full dark:bg-gray-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">{{ title }}</h3>
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            @click="$emit('close')"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="mb-6">
          <slot></slot>
        </div>
        <div class="flex gap-4">
          <button
            type="button"
            class="btn-secondary flex-1"
            @click="$emit('close')"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="btn-primary flex-1"
            @click="$emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  confirmText?: string
  cancelText?: string
}

withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel'
})

defineEmits<{
  close: []
  confirm: []
}>()
</script>
