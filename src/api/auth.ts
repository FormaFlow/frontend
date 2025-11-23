import client from './client'
import type { AuthCredentials, AuthResponse, RegisterData, User } from '@/types/user'

export const authApi = {
  register: (data: RegisterData) => {
    return client.post<AuthResponse>('register', data)
  },
  login: (credentials: AuthCredentials) => {
    return client.post<AuthResponse>('login', credentials)
  },
  logout: () => {
    return client.post('logout')
  },
  refresh: () => {
    return client.post<AuthResponse>('refresh')
  },
  getProfile: () => {
    return client.get<User>('profile')
  }
}
