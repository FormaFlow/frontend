import { useUiStore } from '@/stores/ui'
import { computed } from 'vue'

export const useNotification = () => {
  const uiStore = useUiStore()

  const notifications = computed(() => uiStore.notifications)

  const showSuccess = (message: string, duration?: number) => {
    return uiStore.addNotification({
      type: 'success',
      message,
      duration
    })
  }

  const showError = (message: string, duration?: number) => {
    return uiStore.addNotification({
      type: 'error',
      message,
      duration
    })
  }

  const showInfo = (message: string, duration?: number) => {
    return uiStore.addNotification({
      type: 'info',
      message,
      duration
    })
  }

  const showWarning = (message: string, duration?: number) => {
    return uiStore.addNotification({
      type: 'warning',
      message,
      duration
    })
  }

  const remove = (id: string) => {
    uiStore.removeNotification(id)
  }

  return {
    notifications,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    remove
  }
}
