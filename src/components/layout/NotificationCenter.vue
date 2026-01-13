<template>
  <Teleport to="body">
    <div class="fixed top-20 right-4 z-[200] space-y-3 pointer-events-none max-w-sm w-full">
      <transition-group name="notification" tag="div" class="space-y-3">
        <div
            v-for="notification in notifications"
            :key="notification.id"
            :class="[
            'notification pointer-events-auto',
            `notification-${notification.type}`
          ]"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <component :is="getIcon(notification.type)" class="w-5 h-5"/>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm break-words">{{ notification.message }}</p>
            </div>

            <button
                type="button"
                class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                @click="remove(notification.id)"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>


<script setup lang="ts">
import {defineAsyncComponent, type Component} from 'vue'
import {useNotification} from '@/composables/useNotification'

const {notifications, remove} = useNotification()

const getIcon = (type: string) => {
  const icons: Record<string, Component> = {
    success: defineAsyncComponent(() => Promise.resolve({
      template: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
    })),
    error: defineAsyncComponent(() => Promise.resolve({
      template: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
    })),
    info: defineAsyncComponent(() => Promise.resolve({
      template: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
    })),
    warning: defineAsyncComponent(() => Promise.resolve({
      template: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
    }))
  }
  return icons[type] || icons.info
}
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-leave-active {
  position: absolute;
  width: calc(100% - 2rem);
}

.notification-enter-from,
.notification-leave-to {
  transform: translateX(120%);
  opacity: 0;
}

.notification {
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.notification-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.notification-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.notification-info {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #3b82f6;
}

.notification-warning {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

:global(.dark) .notification-success {
  background-color: #064e3b;
  color: #6ee7b7;
  border-color: #10b981;
}

:global(.dark) .notification-error {
  background-color: #7f1d1d;
  color: #fca5a5;
  border-color: #ef4444;
}

:global(.dark) .notification-info {
  background-color: #1e3a8a;
  color: #93c5fd;
  border-color: #3b82f6;
}

:global(.dark) .notification-warning {
  background-color: #78350f;
  color: #fcd34d;
  border-color: #f59e0b;
}
</style>
