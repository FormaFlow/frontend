import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFormsStore } from '../forms'
import { formsApi } from '@/api/forms'
import { db } from '@/db'

vi.mock('@/api/forms', () => ({
  formsApi: {
    list: vi.fn(),
    get: vi.fn(),
  }
}))

const mockOnLine = vi.spyOn(navigator, 'onLine', 'get')

describe('useFormsStore Offline', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    await db.forms.clear()
    mockOnLine.mockReturnValue(true)
  })

  it('saves to indexedDB on successful fetch', async () => {
    const store = useFormsStore()
    const mockForms = [{ id: 'f1', name: 'Form 1', fields: [], published: true, created_at: '' }]
    vi.mocked(formsApi.list).mockResolvedValue({ forms: mockForms, total: 1, limit: 15, offset: 0 })
    
    await store.fetchForms()
    
    const cached = await db.getForms()
    expect(cached).toHaveLength(1)
    expect(cached[0].name).toBe('Form 1')
  })

  it('loads from indexedDB when offline', async () => {
    const store = useFormsStore()
    const mockForms = [{ id: 'f1', name: 'Cached Form', fields: [], published: true, created_at: '' }]
    await db.saveForms(mockForms)
    
    mockOnLine.mockReturnValue(false)
    
    await store.fetchForms()
    
    expect(store.forms).toHaveLength(1)
    expect(store.forms[0].name).toBe('Cached Form')
    expect(formsApi.list).not.toHaveBeenCalled()
  })

  it('passes is_quiz parameter to API', async () => {
    const store = useFormsStore()
    vi.mocked(formsApi.list).mockResolvedValue({ forms: [], total: 0, limit: 15, offset: 0 })
    
    // Test with isQuiz = true
    await store.fetchForms(1, undefined, undefined, true)
    expect(formsApi.list).toHaveBeenCalledWith(expect.objectContaining({ is_quiz: 1 }))
    
    // Test with isQuiz = false
    await store.fetchForms(1, undefined, undefined, false)
    expect(formsApi.list).toHaveBeenCalledWith(expect.objectContaining({ is_quiz: 0 }))
  })
})
