import {defineStore} from 'pinia'
import {ref} from 'vue'
import {formsApi} from '@/api/forms'
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

  const fetchForms = async (page = 1, search?: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await formsApi.list({page, search})
      if (response) {
        forms.value = response.forms || []
        pagination.value = {
          total: response.total,
          per_page: response.limit,
          current_page: Math.ceil((response.offset / response.limit) + 1),
          last_page: Math.ceil(response.total / response.limit)
        }
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchForm = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await formsApi.get(id)
      if (response) {
        currentForm.value = response
      }
    } catch (err: any) {
      error.value = err.message
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
        forms.value.unshift(response)
        return response
      }
    } catch (err: any) {
      error.value = err.message
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
        const index = forms.value.findIndex(f => f.id === id)
        if (index !== -1) {
          forms.value[index] = response
        }
        if (currentForm.value?.id === id) {
          currentForm.value = response
        }
        return response
      }
    } catch (err: any) {
      error.value = err.message
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
    } catch (err: any) {
      error.value = err.message
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
        const index = forms.value.findIndex(f => f.id === id)
        if (index !== -1) {
          forms.value[index] = response
        }
        if (currentForm.value?.id === id) {
          currentForm.value = response
        }
        return response
      }
    } catch (err: any) {
      error.value = err.message
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
