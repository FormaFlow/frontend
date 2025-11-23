export interface User {
  id: string
  name: string
  email: string
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
}

export interface AuthResponse {
  user: User
  token: string
}
