import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import { ApiError } from '@/api/client'

export type Theme = 'light' | 'dark' | 'system'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export const useUiStore = defineStore('ui', () => {
  const theme = ref<Theme>('system')
  const notifications = ref<Notification[]>([])
  const sidebarOpen = ref(false)

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'system'
    theme.value = savedTheme
    applyTheme(savedTheme)
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  const applyTheme = (selectedTheme: Theme) => {
    const html = document.documentElement
    let effectiveTheme = selectedTheme

    if (selectedTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    if (effectiveTheme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  const isDarkMode = computed(() => {
    if (theme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.value === 'dark'
  })

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const n: Notification = {...notification, id}
    notifications.value.push(n)

    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 3000)
    }

    return id
  }

  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const handleApiError = (error: unknown, defaultMessage = 'An error occurred') => {
    console.error(error)
    let message = defaultMessage

    if (error instanceof ApiError) {
      message = error.message
      // If there are validation errors, we might want to show the first one or just the main message
      // For notifications, simpler is better. Detailed validation errors usually go to the form fields.
    } else if (error instanceof Error) {
      message = error.message
    }

    addNotification({
      type: 'error',
      message
    })
  }

  return {
    theme,
    notifications,
    sidebarOpen,
    isDarkMode,
    initializeTheme,
    setTheme,
    applyTheme,
    addNotification,
    removeNotification,
    toggleSidebar,
    handleApiError
  }
})
