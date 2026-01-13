import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFormsStore } from '../forms'
import { formsApi } from '@/api/forms'
import type { PaginatedResponse } from '@/types/api'
import type { Form } from '@/types/form'

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
    vi.mocked(formsApi.list).mockResolvedValue(mockResponse as unknown as PaginatedResponse<Form>)

    await store.fetchForms()

    expect(store.loading).toBe(false)
    expect(store.forms).toHaveLength(2)
    expect(formsApi.list).toHaveBeenCalled()
  })

  it('creates form successfully', async () => {
    const store = useFormsStore()
    const newForm = { name: 'New Form', description: 'New Desc', is_quiz: false }
    const createdForm = { ...newForm, id: '3', fields: [], published: false, created_at: 'now', user_id: 'u1', single_submission: false }

    vi.mocked(formsApi.create).mockResolvedValue(createdForm as unknown as Form)

    await store.createForm(newForm)

    expect(formsApi.create).toHaveBeenCalledWith(newForm)
    expect(store.forms).toContainEqual(createdForm)
  })
})