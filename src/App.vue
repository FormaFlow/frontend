<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
    <TheHeader/>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view/>
    </main>
  </div>
  <NotificationCenter/>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted} from 'vue'
import TheHeader from '@/components/layout/TheHeader.vue'
import NotificationCenter from '@/components/layout/NotificationCenter.vue'
import {useTheme} from '@/composables/useTheme'
import {useAuthStore} from '@/stores/auth'
import {useEntriesStore} from '@/stores/entries'
import {useNotification} from '@/composables/useNotification'
import {useI18n} from 'vue-i18n'

const {initializeTheme} = useTheme()
const authStore = useAuthStore()
const entriesStore = useEntriesStore()
const {showInfo} = useNotification()
const {t} = useI18n()

const handleOnline = async () => {
  showInfo(t('common.online_sync'))
  await entriesStore.syncPendingEntries()
}

onMounted(() => {
  initializeTheme()
  authStore.initializeAuth()
  entriesStore.syncPendingEntries()
  window.addEventListener('online', handleOnline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
})
</script>
