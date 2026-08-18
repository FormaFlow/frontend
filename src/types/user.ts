export interface User {
  id: string
  name: string
  email: string | null
  login?: string
  account_type?: 'standard' | 'managed_learner'
  target_grade?: number
  timezone?: string
  created_at: string
  updated_at: string
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
  timezone?: string
}

export interface AuthResponse {
  user: User
  token: string
  workspace?: Workspace
}

export interface ManagedAuthCredentials {
  workspace: string
  login: string
  pin: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  type: string
  timezone: string
  role: 'owner' | 'admin' | 'learner' | 'member'
  modules?: Record<string, boolean>
}
