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
import {onMounted} from 'vue'
import TheHeader from '@/components/layout/TheHeader.vue'
import NotificationCenter from '@/components/layout/NotificationCenter.vue'
import {useTheme} from '@/composables/useTheme'
import {useAuthStore} from '@/stores/auth'

const {initializeTheme} = useTheme()
const authStore = useAuthStore()

onMounted(() => {
  initializeTheme()
  authStore.initializeAuth()
})
</script>
