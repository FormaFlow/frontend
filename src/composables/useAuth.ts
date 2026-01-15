import {useAuthStore} from '@/stores/auth'
import {useUiStore} from '@/stores/ui'
import type {AuthCredentials, RegisterData} from '@/types/user'
import {useRouter} from "vue-router";

export const useAuth = () => {
  const authStore = useAuthStore()
  const uiStore = useUiStore()
  const router = useRouter()

  const login = async (credentials: AuthCredentials) => {
    try {
      const result = await authStore.login(credentials)
      if (result) {
        const redirect = router.currentRoute.value.query.redirect as string
        await router.push(redirect || { name: 'dashboard' })
        return true
      }
      return false
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Login failed')
      return false
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const result = await authStore.register(data)
      if (result) {
        await router.push({ name: 'dashboard' })
        return true
      }
      return false
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Registration failed')
      return false
    }
  }

  const logout = async () => {
    await authStore.logout()
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
