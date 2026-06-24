import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEntriesStore } from '../entries'
import { entriesApi } from '@/api/entries'
import { db } from '@/db'

vi.mock('@/api/entries', () => ({
  entriesApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}))

// Mock navigator.onLine
const mockOnLine = vi.spyOn(navigator, 'onLine', 'get')

describe('useEntriesStore Offline', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    await db.pendingEntries.clear()
    await db.entries.clear()
    mockOnLine.mockReturnValue(true)
  })

  it('saves to indexedDB when offline', async () => {
    const store = useEntriesStore()
    mockOnLine.mockReturnValue(false)
    
    const mockEntryData = { form_id: 'form-1', data: { test: 'data' } }
    
    // Should not throw, but handle offline gracefully
    await store.createEntry(mockEntryData)
    
    const pending = await db.getPendingEntries()
    expect(pending).toHaveLength(1)
    expect(pending[0].form_id).toBe('form-1')
    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].id).toMatch(/^pending-/)
  })

  it('saves to indexedDB when API fails with network error', async () => {
    const store = useEntriesStore()
    mockOnLine.mockReturnValue(true)
    vi.mocked(entriesApi.create).mockRejectedValue(new Error('Network Error'))
    
    const mockEntryData = { form_id: 'form-1', data: { test: 'data' } }
    
    await store.createEntry(mockEntryData)
    
    const pending = await db.getPendingEntries()
    expect(pending).toHaveLength(1)
  })

  it('caches fetched entries for offline pagination', async () => {
    const store = useEntriesStore()
    vi.mocked(entriesApi.list).mockResolvedValue({
      entries: [
        { id: 'e1', form_id: 'form-1', data: {}, created_at: '2026-06-21T10:00:00Z', updated_at: '2026-06-21T10:00:00Z' },
        { id: 'e2', form_id: 'form-1', data: {}, created_at: '2026-06-20T10:00:00Z', updated_at: '2026-06-20T10:00:00Z' }
      ],
      total: 2,
      limit: 2,
      offset: 0
    })

    await store.fetchEntries(1, 'form-1', 2)
    mockOnLine.mockReturnValue(false)
    vi.mocked(entriesApi.list).mockClear()

    await store.fetchEntries(1, 'form-1', 1)

    expect(entriesApi.list).not.toHaveBeenCalled()
    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].id).toBe('e1')
    expect(store.pagination.total).toBe(2)
  })

  it('syncs pending entries when online', async () => {
    const store = useEntriesStore()
    
    // 1. Add some pending entries
    await db.savePendingEntry({ form_id: 'f1', data: { val: 1 }, created_at: 'now' })
    await db.savePendingEntry({ form_id: 'f2', data: { val: 2 }, created_at: 'now' })
    
    // 2. Mock API success
    vi.mocked(entriesApi.create).mockResolvedValue({ id: 'new-id', form_id: 'f1', data: {}, created_at: '' } as any)
    
    // 3. Trigger sync
    await store.syncPendingEntries()
    
    // 4. Verify API was called twice
    expect(entriesApi.create).toHaveBeenCalledTimes(2)
    
    // 5. Verify local DB is empty
    const pending = await db.getPendingEntries()
    expect(pending).toHaveLength(0)
  })
})
