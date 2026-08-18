import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {authApi} from '@/api/auth'
import type {AuthCredentials, ManagedAuthCredentials, RegisterData, User, Workspace} from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loginWorkspace = ref<Workspace | null>(null)

  const initializeAuth = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')

    if (savedToken) {
      token.value = savedToken
    }
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        localStorage.removeItem('user')
      }
    }
    const savedWorkspace = localStorage.getItem('login_workspace')
    if (savedWorkspace) loginWorkspace.value = JSON.parse(savedWorkspace)
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const register = async (data: RegisterData) => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.register(data)
      console.log(response)
      if (response) {
        user.value = response.user
        token.value = response.token
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        return response
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const login = async (credentials: AuthCredentials) => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(credentials);
      console.log(`AUTH DATA`, response)

      if (response && response.token && response.user) {
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))

        token.value = response.token
        user.value = response.user

        console.log('Saved - token:', token.value)
        console.log('Saved - user:', user.value)
        console.log('isAuthenticated:', isAuthenticated.value)

        return response
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const managedLogin = async (credentials: ManagedAuthCredentials) => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.managedLogin(credentials)
      token.value = response.token
      user.value = response.user
      loginWorkspace.value = response.workspace || null
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      if (response.workspace) localStorage.setItem('login_workspace', JSON.stringify(response.workspace))
      return response
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      token.value = null
      error.value = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('login_workspace')
      loginWorkspace.value = null
    }
  }

  const getProfile = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.getProfile()
      if (response) {
        user.value = response
        localStorage.setItem('user', JSON.stringify(response))
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.updateProfile(data)
      if (response) {
        user.value = response
        localStorage.setItem('user', JSON.stringify(response))
        return response
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  initializeAuth()

  return {
    user,
    loginWorkspace,
    token,
    loading,
    error,
    isAuthenticated,
    initializeAuth,
    register,
    login,
    managedLogin,
    logout,
    getProfile,
    updateProfile
  }
})
