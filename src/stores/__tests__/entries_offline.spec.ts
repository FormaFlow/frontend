import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEntriesStore } from '../entries'
import { entriesApi } from '@/api/entries'
import { db } from '@/db'

vi.mock('@/api/entries', () => ({
  entriesApi: {
    create: vi.fn(),
  }
}))

// Mock navigator.onLine
const mockOnLine = vi.spyOn(navigator, 'onLine', 'get')

describe('useEntriesStore Offline', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    await db.pendingEntries.clear()
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
    expect(entriesApi.create).not.toHaveBeenCalled()
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
