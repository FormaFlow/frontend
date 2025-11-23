import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, AuthCredentials, RegisterData } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Загрузка состояния из localStorage при инициализации
  const initializeAuth = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken) {
      token.value = savedToken
    }
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const register = async (data: RegisterData) => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.register(data)
      if (response.data) {
        user.value = response.data.user
        token.value = response.data.token
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return response.data
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const login = async (credentials: AuthCredentials) => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(credentials)
      if (response.data) {
        user.value = response.data.user
        token.value = response.data.token
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return response.data
      }
    } catch (err: any) {
      error.value = err.message
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
    }
  }

  const getProfile = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.getProfile()
      if (response.data) {
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    initializeAuth,
    register,
    login,
    logout,
    getProfile
  }
})
