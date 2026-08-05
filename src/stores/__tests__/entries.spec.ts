import 'fake-indexeddb/auto'
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
    localStorage.clear()
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

  it('announces a created entry to other browser tabs', async () => {
    const store = useEntriesStore()
    vi.mocked(entriesApi.create).mockResolvedValue({
      id: 'entry-1',
      form_id: 'form-live',
      data: {value: 10},
      created_at: '2026-08-04T10:00:00Z',
      updated_at: '2026-08-04T10:00:00Z'
    } as Entry)

    await store.createEntry({form_id: 'form-live', data: {value: 10}})

    const notification = JSON.parse(localStorage.getItem('formaflow:entry-change') || '{}')
    expect(notification.formId).toBe('form-live')
  })

  it('announces an updated entry to other browser tabs', async () => {
    const store = useEntriesStore()
    vi.mocked(entriesApi.update).mockResolvedValue({
      id: 'entry-updated',
      form_id: 'form-edited',
      data: {value: 20},
      created_at: '2026-08-04T10:00:00Z',
      updated_at: '2026-08-05T10:00:00Z'
    } as Entry)

    await store.updateEntry('entry-updated', {data: {value: 20}})

    const notification = JSON.parse(localStorage.getItem('formaflow:entry-change') || '{}')
    expect(notification.formId).toBe('form-edited')
  })

  it('announces a deleted entry to other browser tabs', async () => {
    const store = useEntriesStore()
    const entry = {
      id: 'entry-deleted',
      form_id: 'form-deleted',
      data: {},
      created_at: '2026-08-04T10:00:00Z',
      updated_at: '2026-08-04T10:00:00Z'
    } as Entry
    vi.mocked(entriesApi.list).mockResolvedValue({entries: [entry], total: 1, limit: 15, offset: 0})
    vi.mocked(entriesApi.delete).mockResolvedValue(undefined)
    await store.fetchEntries()

    await store.deleteEntry(entry.id)

    const notification = JSON.parse(localStorage.getItem('formaflow:entry-change') || '{}')
    expect(notification.formId).toBe('form-deleted')
  })
})
