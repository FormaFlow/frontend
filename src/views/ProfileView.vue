<template>
  <div class="max-w-2xl">
    <div class="card">
      <h1 class="text-2xl font-bold mb-6">{{ $t('settings.profile') }}</h1>

      <div class="space-y-6">
        <div>
          <label class="form-label">{{ $t('auth.name') }}</label>
          <p class="text-gray-700 dark:text-gray-300">{{ user?.name }}</p>
        </div>

        <div>
          <label class="form-label">{{ $t('auth.email') }}</label>
          <p class="text-gray-700 dark:text-gray-300">{{ user?.email }}</p>
        </div>

        <div class="divider"></div>

        <div>
          <h2 class="text-lg font-semibold mb-4">{{ $t('settings.theme') }}</h2>
          <div class="space-y-2">
            <label class="flex items-center gap-3">
              <input type="radio" name="theme" value="light" :checked="theme === 'light'" @change="setTheme('light')"/>
              <span>{{ $t('settings.light') }}</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="radio" name="theme" value="dark" :checked="theme === 'dark'" @change="setTheme('dark')"/>
              <span>{{ $t('settings.dark') }}</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="radio" name="theme" value="system" :checked="theme === 'system'"
                     @change="setTheme('system')"/>
              <span>{{ $t('settings.system') }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useAuthStore} from '@/stores/auth'
import {useTheme} from '@/composables/useTheme'

const authStore = useAuthStore()
const {theme, setTheme} = useTheme()

const user = computed(() => authStore.user)
</script>
