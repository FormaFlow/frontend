import axios, {AxiosInstance} from 'axios'
import type {ApiError, ApiResponse} from '@/types/api'

class ApiClient {
  private instance: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  public getClient() {
    return this.instance
  }

  public async get<T>(url: string, config?: any) {
    try {
      const response = await this.instance.get<ApiResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  public async post<T>(url: string, data?: any, config?: any) {
    try {
      const response = await this.instance.post<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  public async patch<T>(url: string, data?: any, config?: any) {
    try {
      const response = await this.instance.patch<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  public async delete<T>(url: string, config?: any) {
    try {
      const response = await this.instance.delete<ApiResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): ApiError {
    if (error.response?.data) {
      return {
        status: error.response.status,
        message: error.response.data.message || 'An error occurred',
        errors: error.response.data.errors
      }
    }
    return {
      status: error.response?.status || 0,
      message: error.message || 'Network error'
    }
  }
}

export default new ApiClient()
