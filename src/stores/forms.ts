import {defineStore} from 'pinia'
import {ref} from 'vue'
import {formsApi} from '@/api/forms'
import {db} from '@/db'
import {isNetworkError} from '@/utils/network'
import type {CreateFormRequest, Form, FormSummary, UpdateFormRequest} from '@/types/form'

type FormsListRequest = {
  page: number
  search?: string
  limit?: number
  isQuiz?: boolean
}

export const useFormsStore = defineStore('forms', () => {
  const forms = ref<FormSummary[]>([])
  const currentForm = ref<Form | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastListRequest = ref<FormsListRequest>({ page: 1 })
  const pagination = ref({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1
  })

  const fetchForms = async (page = 1, search?: string, limit?: number, isQuiz?: boolean) => {
    lastListRequest.value = { page, search, limit, isQuiz }
    loading.value = true
    error.value = null
    const pageLimit = limit || pagination.value.per_page
    const offset = (page - 1) * pageLimit

    const applyCachedForms = async () => {
      const cached = await db.getForms({ search, isQuiz, limit: pageLimit, offset })
      if (cached.total > 0) {
        forms.value = cached.forms
        pagination.value = {
          total: cached.total,
          per_page: pageLimit,
          current_page: page,
          last_page: Math.max(1, Math.ceil(cached.total / pageLimit))
        }
      }
      return cached.total > 0
    }

    if (!navigator.onLine) {
      await applyCachedForms()
      loading.value = false
      return
    }

    const refreshFromApi = async () => {
      const params: { limit: number; offset: number; search?: string; is_quiz?: number } = {
        limit: pageLimit,
        offset
      }
      
      if (search) {
        params.search = search
      }

      if (isQuiz !== undefined) {
        params.is_quiz = isQuiz ? 1 : 0
      }
      
      const response = await formsApi.list(params)
      
      if (response) {
        forms.value = response.forms || []
        pagination.value = {
          total: response.total,
          per_page: response.limit,
          current_page: page,
          last_page: Math.ceil(response.total / response.limit)
        }
        // Cache forms
        await db.saveFormSummaries(JSON.parse(JSON.stringify(forms.value)))
      }
    }

    const hasCachedForms = await applyCachedForms()
    if (hasCachedForms) {
      loading.value = false
      void refreshFromApi().catch(async (err: unknown) => {
        if (!isNetworkError(err)) {
          error.value = (err as Error).message
        }
      })
      return
    }

    try {
      await refreshFromApi()
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        await applyCachedForms()
      } else {
        error.value = (err as Error).message
        throw err
      }
    } finally {
      loading.value = false
    }
  }

  const refreshCurrentForms = async () => {
    if (!navigator.onLine) return

    const request = lastListRequest.value
    const pageLimit = request.limit || pagination.value.per_page
    const offset = (request.page - 1) * pageLimit
    const params: { limit: number; offset: number; search?: string; is_quiz?: number } = {
      limit: pageLimit,
      offset
    }

    if (request.search) {
      params.search = request.search
    }

    if (request.isQuiz !== undefined) {
      params.is_quiz = request.isQuiz ? 1 : 0
    }

    try {
      const response = await formsApi.list(params)
      if (!response) return

      forms.value = response.forms || []
      pagination.value = {
        total: response.total,
        per_page: response.limit,
        current_page: request.page,
        last_page: Math.max(1, Math.ceil(response.total / response.limit))
      }
      await db.saveFormSummaries(JSON.parse(JSON.stringify(forms.value)))
    } catch (err: unknown) {
      if (!isNetworkError(err)) {
        error.value = (err as Error).message
      }
    }
  }

  const fetchForm = async (id: string) => {
    loading.value = true
    error.value = null

    const cached = await db.getFormDefinition(id)
    if (cached) {
      currentForm.value = cached
      loading.value = false
    }

    if (!navigator.onLine) {
      loading.value = false
      return
    }

    try {
      const response = await formsApi.get(id)
      if (response) {
        currentForm.value = response
        // Cache single form
        await db.saveForms([JSON.parse(JSON.stringify(response))])
      }
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        const cached = await db.getFormDefinition(id)
        if (cached) {
          currentForm.value = cached
        }
      } else {
        error.value = (err as Error).message
        throw err
      }
    } finally {
      loading.value = false
    }
  }

  const fetchPublicForm = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await formsApi.getPublic(id)
      if (response) {
        currentForm.value = response
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createForm = async (data: CreateFormRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await formsApi.create(data)
      if (response) {
        return response
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateForm = async (id: string, data: UpdateFormRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await formsApi.update(id, data)
      if (response) {
        await fetchForm(id)
        return response
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteForm = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await formsApi.delete(id)
      forms.value = forms.value.filter(f => f.id !== id)
      if (currentForm.value?.id === id) {
        currentForm.value = null
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const publishForm = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await formsApi.publish(id)
      if (response) {
        await fetchForm(id)
        return response
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    forms,
    currentForm,
    loading,
    error,
    pagination,
    fetchForms,
    refreshCurrentForms,
    fetchForm,
    fetchPublicForm,
    createForm,
    updateForm,
    deleteForm,
    publishForm
  }
})
