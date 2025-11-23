import { useUiStore } from '@/stores/ui'
import { computed } from 'vue'

export const useTheme = () => {
  const uiStore = useUiStore()

  const theme = computed(() => uiStore.theme)
  const isDark = computed(() => uiStore.isDarkMode)

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    uiStore.setTheme(newTheme)
  }

  return {
    theme,
    isDark,
    setTheme,
    initializeTheme: uiStore.initializeTheme
  }
}
