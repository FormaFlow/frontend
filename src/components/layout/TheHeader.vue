<template>
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <router-link to="/" class="flex items-center gap-2 font-bold text-lg text-primary-500">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            FormaFlow
          </router-link>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center gap-8">
          <router-link to="/forms" class="text-gray-700 dark:text-gray-300 hover:text-primary-500 transition">
            {{ $t('forms.title') }}
          </router-link>
          <router-link to="/entries" class="text-gray-700 dark:text-gray-300 hover:text-primary-500 transition">
            {{ $t('entries.title') }}
          </router-link>
        </nav>

        <!-- Right Section -->
        <div class="flex items-center gap-4">
          <!-- Theme Switcher -->
          <button
              type="button"
              class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              @click="toggleTheme"
              :title="$t('settings.theme')"
          >
            <svg v-if="isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.414 5.414a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707zM5 11a1 1 0 100-2H4a1 1 0 100 2h1z"
                    clip-rule="evenodd"></path>
            </svg>
          </button>

          <!-- Language Switcher -->
          <div class="relative">
            <button
                type="button"
                class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-sm font-medium"
                @click="showLangMenu = !showLangMenu"
            >
              {{ currentLocale.toUpperCase() }}
            </button>
            <div v-if="showLangMenu" class="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
              <button
                  v-for="lang in ['en', 'ru']"
                  :key="lang"
                  type="button"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                  :class="currentLocale === lang && 'bg-primary-50 dark:bg-primary-900 text-primary-500'"
                  @click="setLocale(lang); showLangMenu = false"
              >
                {{ lang.toUpperCase() }}
              </button>
            </div>
          </div>

          <!-- User Menu -->
          <div class="relative">
            <button
                type="button"
                class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                @click="showUserMenu = !showUserMenu"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clip-rule="evenodd"></path>
              </svg>
            </button>
            <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
              <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ user?.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ user?.email }}</p>
              </div>
              <router-link
                  to="/profile"
                  class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                  @click="showUserMenu = false"
              >
                {{ $t('settings.profile') }}
              </router-link>
              <button
                  type="button"
                  class="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm rounded-b-lg"
                  @click="handleLogout"
              >
                {{ $t('auth.logout') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useAuthStore} from '@/stores/auth'
import {useTheme} from '@/composables/useTheme'
import {useAuth} from '@/composables/useAuth'
import {useNotification} from '@/composables/useNotification'

const router = useRouter()
const {locale, t} = useI18n()
const {isDark, setTheme, theme} = useTheme()
const authStore = useAuthStore()
const {logout} = useAuth()
const {showSuccess} = useNotification()

const showUserMenu = ref(false)
const showLangMenu = ref(false)

const user = computed(() => authStore.user)
const currentLocale = computed(() => locale.value)

const toggleTheme = () => {
  const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
  const currentIndex = themes.indexOf(theme.value as 'light' | 'dark' | 'system')
  const nextIndex = (currentIndex + 1) % themes.length
  setTheme(themes[nextIndex])
}

const setLocale = (lang: string) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

const handleLogout = async () => {
  try {
    await logout()
    showSuccess(t('auth.logout_success'))
    await router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>
