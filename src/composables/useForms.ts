import {storeToRefs} from 'pinia'
import {useFormsStore} from '@/stores/forms'
import {useUiStore} from '@/stores/ui'
import type {CreateFormRequest, UpdateFormRequest} from '@/types/form'

export const useForms = () => {
  const formsStore = useFormsStore()
  const uiStore = useUiStore()
  const {forms, currentForm, loading, pagination} = storeToRefs(formsStore)

  const createForm = async (data: CreateFormRequest) => {
    try {
      const result = await formsStore.createForm(data)
      return result
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Failed to create form')
      return null
    }
  }

  const updateForm = async (id: string, data: UpdateFormRequest) => {
    try {
      const response = await formsStore.updateForm(id, data)
      if (response) {
        uiStore.addNotification({
          type: 'success',
          message: 'Form updated successfully'
        })

        await formsStore.fetchForm(id)

        const index = formsStore.forms.findIndex(f => f.id === id)
        if (index !== -1 && formsStore.currentForm) {
          formsStore.forms[index] = formsStore.currentForm
        }

        return formsStore.currentForm
      }
    } catch (error: any) {
      uiStore.addNotification({
        type: 'error',
        message: error.message || 'Failed to update form'
      })
      throw error
    }
  }

  const deleteForm = async (id: string) => {
    try {
      await formsStore.deleteForm(id)
      uiStore.addNotification({
        type: 'success',
        message: 'Form deleted successfully'
      })
    } catch (error: any) {
      uiStore.addNotification({
        type: 'error',
        message: error.message || 'Failed to delete form'
      })
      throw error
    }
  }

  const publishForm = async (id: string) => {
    try {
      const form = await formsStore.publishForm(id)
      uiStore.addNotification({
        type: 'success',
        message: 'Form published successfully'
      })
      return form
    } catch (error: any) {
      uiStore.addNotification({
        type: 'error',
        message: error.message || 'Failed to publish form'
      })
      throw error
    }
  }

  return {
    forms,
    currentForm,
    loading,
    pagination,
    fetchForms: formsStore.fetchForms,
    fetchForm: formsStore.fetchForm,
    createForm,
    updateForm,
    deleteForm,
    publishForm
  }
}
