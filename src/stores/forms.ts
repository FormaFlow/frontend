import {defineStore} from 'pinia'
import {ref} from 'vue'
import {formsApi} from '@/api/forms'
import {db} from '@/db'
import type {CreateFormRequest, Form, UpdateFormRequest} from '@/types/form'

export const useFormsStore = defineStore('forms', () => {
  const forms = ref<Form[]>([])
  const currentForm = ref<Form | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1
  })

  const fetchForms = async (page = 1, search?: string, limit?: number, isQuiz?: boolean) => {
    loading.value = true
    error.value = null

    if (!navigator.onLine) {
      const cachedForms = await db.getForms()
      forms.value = cachedForms
      loading.value = false
      return
    }

    try {
      const pageLimit = limit || pagination.value.per_page
      const offset = (page - 1) * pageLimit
      
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
        await db.saveForms(JSON.parse(JSON.stringify(forms.value)))
      }
    } catch (err: unknown) {
      // Fallback to cache on network error
      if (err instanceof Error && (err.message.includes('Network Error') || !navigator.onLine)) {
        const cachedForms = await db.getForms()
        forms.value = cachedForms
      } else {
        error.value = (err as Error).message
        throw err
      }
    } finally {
      loading.value = false
    }
  }

  const fetchForm = async (id: string) => {
    loading.value = true
    error.value = null

    if (!navigator.onLine) {
      const cached = await db.forms.get(id)
      if (cached) {
        currentForm.value = cached
      }
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
      if (err instanceof Error && (err.message.includes('Network Error') || !navigator.onLine)) {
        const cached = await db.forms.get(id)
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

  const createForm = async (data: CreateFormRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await formsApi.create(data)
      if (response) {
        forms.value.unshift(response)
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
    fetchForm,
    createForm,
    updateForm,
    deleteForm,
    publishForm
  }
})