export interface ApiResponse extends Record<string, unknown> {
  message?: string
  errors?: Record<string, string[]>
  status: number
}

export type ApiResult<T> = T & ApiResponse

export interface ApiError {
  status: number
  message: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data?: T[]
  forms?: T[]
  entries?: T[]
  total: number
  limit: number
  offset: number
}
