import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { AuthCredentials, RegisterData } from '@/types/user'

export const useAuth = () => {
  const authStore = useAuthStore()
  const uiStore = useUiStore()

  const login = async (credentials: AuthCredentials) => {
    try {
      await authStore.login(credentials)
      uiStore.addNotification({
        type: 'success',
        message: 'Successfully logged in'
      })
    } catch (error: any) {
      uiStore.addNotification({
        type: 'error',
        message: error.message || 'Login failed'
      })
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      await authStore.register(data)
      uiStore.addNotification({
        type: 'success',
        message: 'Account created successfully'
      })
    } catch (error: any) {
      uiStore.addNotification({
        type: 'error',
        message: error.message || 'Registration failed'
      })
      throw error
    }
  }

  const logout = async () => {
    await authStore.logout()
    uiStore.addNotification({
      type: 'success',
      message: 'You have been logged out'
    })
  }

  return {
    user: authStore.user,
    token: authStore.token,
    isAuthenticated: authStore.isAuthenticated,
    loading: authStore.loading,
    login,
    register,
    logout
  }
}
