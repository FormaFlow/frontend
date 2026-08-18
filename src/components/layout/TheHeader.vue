<template>
  <header class="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <router-link to="/" class="flex items-center gap-2 text-lg font-bold text-primary-500">
          <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          FormaFlow
        </router-link>

        <button
            type="button"
            class="rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            :aria-expanded="showMenu"
            aria-controls="main-navigation"
            :aria-label="$t(showMenu ? 'common.close_navigation' : 'common.open_navigation')"
            @click="showMenu = !showMenu"
        >
          <svg v-if="showMenu" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12"/>
          </svg>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      <nav
          v-if="showMenu"
          id="main-navigation"
          :aria-label="$t('common.main_navigation')"
          class="border-t border-gray-200 py-2 dark:border-gray-700"
      >
        <router-link
            to="/forms"
            class="block px-2 py-3 text-gray-700 hover:text-primary-500 dark:text-gray-300"
            @click="showMenu = false"
        >
          {{ $t('forms.title') }}
        </router-link>
        <router-link
            to="/entries"
            class="block px-2 py-3 text-gray-700 hover:text-primary-500 dark:text-gray-300"
            @click="showMenu = false"
        >
          {{ $t('entries.title') }}
        </router-link>
        <router-link
            to="/quizzes"
            class="block px-2 py-3 text-gray-700 hover:text-primary-500 dark:text-gray-300"
            @click="showMenu = false"
        >
          {{ $t('quizzes.title') }}
        </router-link>
        <div class="flex items-center justify-between px-2 py-3 text-gray-400 dark:text-gray-500">
          <span aria-disabled="true">{{ $t('payments.title') }}</span>
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">{{ $t('common.soon') }}</span>
        </div>

        <div class="my-2 border-t border-gray-200 dark:border-gray-700"></div>

        <button
            type="button"
            class="flex w-full items-center justify-between px-2 py-3 text-left text-gray-700 hover:text-primary-500 dark:text-gray-300"
            @click="toggleTheme"
        >
          <span>{{ $t('settings.theme') }}</span>
          <span class="text-sm text-gray-500">{{ $t(`settings.${theme}`) }}</span>
        </button>

        <div class="flex items-center justify-between px-2 py-2 text-gray-700 dark:text-gray-300">
          <span>{{ $t('settings.language') }}</span>
          <div class="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
            <button
                v-for="lang in ['en', 'ru']"
                :key="lang"
                type="button"
                class="px-3 py-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="currentLocale === lang && 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-300'"
                @click="setLocale(lang)"
            >
              {{ lang.toUpperCase() }}
            </button>
          </div>
        </div>

        <div class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
          <div class="px-2 py-2">
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ user?.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ user?.email }}</p>
          </div>
          <router-link
              to="/profile"
              class="block px-2 py-3 text-gray-700 hover:text-primary-500 dark:text-gray-300"
              @click="showMenu = false"
          >
            {{ $t('settings.profile') }}
          </router-link>
          <button
              type="button"
              class="w-full px-2 py-3 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="handleLogout"
          >
            {{ $t('auth.logout') }}
          </button>
        </div>
      </nav>
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
const {setTheme, theme} = useTheme()
const authStore = useAuthStore()
const {logout} = useAuth()
const {showSuccess} = useNotification()

const showMenu = ref(false)
const user = computed(() => authStore.user)
const currentLocale = computed(() => locale.value)

const toggleTheme = () => {
  const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
  const currentIndex = themes.indexOf(theme.value as 'light' | 'dark' | 'system')
  setTheme(themes[(currentIndex + 1) % themes.length])
}

const setLocale = (lang: string) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

const handleLogout = async () => {
  try {
    await logout()
    showSuccess(t('auth.logout_success'))
    showMenu.value = false
    await router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>
