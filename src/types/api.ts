export interface ApiResponse<T> {
  message?: string
  errors?: Record<string, string[]>
  status: number
}

export interface PaginatedResponse<T> {
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
