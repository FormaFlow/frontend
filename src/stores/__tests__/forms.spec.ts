import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFormsStore } from '../forms'
import { formsApi } from '@/api/forms'

// Mock the forms API
vi.mock('@/api/forms', () => ({
  formsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn()
  }
}))

// Mock UI Store (as forms store uses it for notifications usually, or we can just mock the store itself if needed)
// But since we are testing forms store, we should let it use the real UI store OR mock the UI store actions.
// Let's assume UI store is independent or lightweight enough.
// Actually, `useUiStore` is imported in `forms.ts`. We should mock the store definition or just let it run.
// Pinia testing requires `setActivePinia`.

describe('useFormsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches forms successfully', async () => {
    const store = useFormsStore()
    
    const mockForms = [
      { id: '1', name: 'Form 1', description: 'Desc 1', fields: [], is_quiz: false, single_submission: false, published: true, created_at: '2023-01-01', user_id: 'u1' },
      { id: '2', name: 'Form 2', description: 'Desc 2', fields: [], is_quiz: true, single_submission: true, published: false, created_at: '2023-01-02', user_id: 'u1' }
    ]

    const mockResponse = {
      forms: mockForms,
      total: 2,
      limit: 15,
      offset: 0
    }

    // Setup mock return value
    vi.mocked(formsApi.list).mockResolvedValue(mockResponse as any)

    expect(store.loading).toBe(false)
    expect(store.forms).toEqual([])

    await store.fetchForms()

    expect(store.loading).toBe(false)
    expect(store.forms).toHaveLength(2)
    expect(store.forms[0].id).toBe('1')
    expect(formsApi.list).toHaveBeenCalledWith({ limit: 10, offset: 0 })
  })

  it('handles error during fetch', async () => {
    const store = useFormsStore()
    const error = new Error('Network Error')
    
    vi.mocked(formsApi.list).mockRejectedValue(error)

    await expect(store.fetchForms()).rejects.toThrow('Network Error')
    
    expect(store.loading).toBe(false)
    // Assuming the store doesn't clear previous forms on error, or handles it gracefully
  })

  it('creates a form', async () => {
    const store = useFormsStore()
    const newForm = { name: 'New Form', description: 'New Desc', is_quiz: false, single_submission: false }
    const createdForm = { ...newForm, id: '3', fields: [], published: false, created_at: 'now', user_id: 'u1' }

    vi.mocked(formsApi.create).mockResolvedValue(createdForm as any)

    await store.createForm(newForm)

    expect(formsApi.create).toHaveBeenCalledWith(newForm)
    // Depending on store implementation, it might add to list or just return
    // Let's check if it called API correctly
  })
})
