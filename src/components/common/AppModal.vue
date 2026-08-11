<template>
  <Teleport to="body">
    <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-[100]"
        @click="$emit('close')"
    ></div>

    <div
        v-if="isOpen"
        class="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
    >
      <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :class="['card flex w-full flex-col overflow-hidden dark:bg-gray-800 pointer-events-auto shadow-2xl', maxWidth]"
          style="max-height: calc(100vh - 2rem); max-height: calc(100dvh - 2rem)"
      >
        <div class="mb-4 flex shrink-0 items-center justify-between">
          <h3 :id="titleId" class="text-lg font-semibold">{{ title }}</h3>
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
        <div
            data-testid="modal-scroll-body"
            class="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pr-1"
        >
          <slot></slot>
        </div>
        <div class="mt-4 flex shrink-0 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
              v-if="showCancel"
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

<script lang="ts">
let openModalCount = 0
let originalBodyOverflow = ''
let originalHtmlOverflow = ''
let modalId = 0
</script>

<script setup lang="ts">
import {onBeforeUnmount, watch} from 'vue'

interface Props {
  isOpen: boolean
  title: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  showCancel: true,
  maxWidth: 'max-w-md'
})

defineEmits<{
  close: []
  confirm: []
}>()

const titleId = `app-modal-title-${++modalId}`
let ownsScrollLock = false

const lockBackgroundScroll = () => {
  if (ownsScrollLock || typeof document === 'undefined') return
  if (openModalCount === 0) {
    originalBodyOverflow = document.body.style.overflow
    originalHtmlOverflow = document.documentElement.style.overflow
  }
  openModalCount += 1
  ownsScrollLock = true
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
}

const unlockBackgroundScroll = () => {
  if (!ownsScrollLock || typeof document === 'undefined') return
  openModalCount = Math.max(0, openModalCount - 1)
  ownsScrollLock = false
  if (openModalCount === 0) {
    document.body.style.overflow = originalBodyOverflow
    document.documentElement.style.overflow = originalHtmlOverflow
  }
}

watch(() => props.isOpen, isOpen => {
  if (isOpen) lockBackgroundScroll()
  else unlockBackgroundScroll()
}, {immediate: true})

onBeforeUnmount(unlockBackgroundScroll)
</script>
