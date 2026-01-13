import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEntriesStore } from '../entries'
import { entriesApi } from '@/api/entries'
import type { PaginatedResponse } from '@/types/api'
import type { Entry } from '@/types/entry'

vi.mock('@/api/entries', () => ({
  entriesApi: {
    list: vi.fn(),
    listByForm: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn()
  }
}))

describe('useEntriesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches entries successfully', async () => {
    const store = useEntriesStore()
    const mockEntries = [{ id: '1', form_id: 'f1', data: {} }]
    const mockResponse = {
      entries: mockEntries,
      total: 1,
      limit: 15,
      offset: 0
    }

    vi.mocked(entriesApi.list).mockResolvedValue(mockResponse as unknown as PaginatedResponse<Entry>)

    await store.fetchEntries()

    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].id).toBe('1')
    expect(entriesApi.list).toHaveBeenCalledWith({ limit: 15, offset: 0 })
  })

  it('fetches entries by form id', async () => {
    const store = useEntriesStore()
    const mockResponse = { entries: [], total: 0, limit: 15, offset: 0 }
    vi.mocked(entriesApi.list).mockResolvedValue(mockResponse as unknown as PaginatedResponse<Entry>)

    await store.fetchEntries(1, 'form-123')

    expect(entriesApi.list).toHaveBeenCalledWith({ limit: 15, offset: 0, form_id: 'form-123' })
  })
})