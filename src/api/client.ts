import axios, {type AxiosInstance, type AxiosResponse} from 'axios'
import router from '@/router'
import {PaginatedResponse} from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          await router.push('/login')
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, {params})
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data)
    return response.data
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data)
    return response.data
  }

  async delete<T = void>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url)
    return response.data
  }

  async getUser<T>(url: string): Promise<T> {
    return this.get<T>(url)
  }

  async getForm<T>(url: string): Promise<T> {
    return this.get<T>(url)
  }

  async getEntry<T>(url: string): Promise<T> {
    return this.get<T>(url)
  }

  async postUser<T>(url: string, data?: any): Promise<T> {
    return this.post<T>(url, data)
  }

  async postForm<T>(url: string, data?: any): Promise<T> {
    return this.post<T>(url, data)
  }

  async postEntry<T>(url: string, data?: any): Promise<T> {
    return this.post<T>(url, data)
  }

  async patchForm<T>(url: string, data?: any): Promise<T> {
    return this.patch<T>(url, data)
  }

  async patchEntry<T>(url: string, data?: any): Promise<T> {
    return this.patch<T>(url, data)
  }

  async getPaginatedResponse<T>(url: string, params?: any): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(url, params)
  }
}

export default new ApiClient()
