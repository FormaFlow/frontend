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
    expect(cached.forms).toHaveLength(1)
    expect(cached.forms[0].name).toBe('Form 1')
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

  it('serves cached forms immediately while refreshing online', async () => {
    const store = useFormsStore()
    const cachedForms = [{ id: 'f1', name: 'Cached Form', fields: [], published: true, created_at: '2026-07-05' }]
    await db.saveForms(cachedForms)
    vi.mocked(formsApi.list).mockImplementation(() => new Promise(() => {}))

    await store.fetchForms()

    expect(store.loading).toBe(false)
    expect(store.forms).toHaveLength(1)
    expect(store.forms[0].name).toBe('Cached Form')
    expect(formsApi.list).toHaveBeenCalled()
  })

  it('refreshes current forms from API and updates cache', async () => {
    const store = useFormsStore()
    vi.mocked(formsApi.list).mockResolvedValueOnce({
      forms: [{ id: 'f1', name: 'Fresh Form', fields: [], published: true, created_at: '2026-07-06' }],
      total: 1,
      limit: 10,
      offset: 0
    })

    await store.refreshCurrentForms()

    const cached = await db.getForms()
    expect(store.forms[0].name).toBe('Fresh Form')
    expect(cached.forms[0].name).toBe('Fresh Form')
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
