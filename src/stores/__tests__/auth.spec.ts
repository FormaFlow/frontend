import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import client from '@/api/client'

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  },
  ApiError: class extends Error {}
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('logs in successfully', async () => {
    const store = useAuthStore()
    const mockUser = { id: '1', name: 'User', email: 'test@test.com' }
    const mockResponse = { token: 'fake-token', user: mockUser }

    vi.mocked(client.post).mockResolvedValue(mockResponse)

    const result = await store.login({ email: 'test@test.com', password: 'password' })

    expect(result).toEqual(mockResponse)
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('auth_token')).toBe('fake-token')
  })

  it('handles login failure', async () => {
    const store = useAuthStore()
    vi.mocked(client.post).mockRejectedValue(new Error('Invalid credentials'))

    await expect(store.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('Invalid credentials')

    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  it('fetches profile', async () => {
    const store = useAuthStore()
    const mockUser = { id: '1', name: 'User' }
    
    vi.mocked(client.get).mockResolvedValue(mockUser)

    await store.getProfile()
    expect(store.user).toEqual(mockUser)
  })
})
