export interface ApiResponse<T> {
  data?: T
  message?: string
  errors?: Record<string, string[]>
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    count: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface ApiError {
  status: number
  message: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    count: number
    per_page: number
    current_page: number
    last_page: number
  }
}
