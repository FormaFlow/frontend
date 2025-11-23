import client from './client'
import type { AuthCredentials, RegisterData, AuthResponse, User } from '@/types/user'

export const authApi = {
  register(data: RegisterData) {
    return client.post<AuthResponse>('/auth/register', data)
  },

  login(credentials: AuthCredentials) {
    return client.post<AuthResponse>('/auth/login', credentials)
  },

  logout() {
    return client.post('/auth/logout')
  },

  refresh() {
    return client.post<AuthResponse>('/auth/refresh')
  },

  getProfile() {
    return client.get<User>('/auth/profile')
  }
}
