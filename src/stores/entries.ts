import {defineStore} from 'pinia'
import {ref} from 'vue'
import {entriesApi} from '@/api/entries'
import type {CreateEntryRequest, Entry, UpdateEntryRequest} from '@/types/entry'

export const useEntriesStore = defineStore('entries', () => {
  const entries = ref<Entry[]>([])
  const currentEntry = ref<Entry | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1
  })

  const fetchEntries = async (page = 1, formId?: string) => {
    loading.value = true
    error.value = null
    try {
      const params = {page}
      if (formId) params.form_id = formId
      const response = await entriesApi.list(params)
      if (response) {
        entries.value = response.entries || []
        pagination.value = {
          total: response.total || 0,
          per_page: response.limit || 10,
          current_page: 1,
          last_page: Math.ceil((response.total || 0) / (response.limit || 10))
        }
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchEntry = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await entriesApi.get(id)
      if (response) {
        currentEntry.value = response
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createEntry = async (data: CreateEntryRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await entriesApi.create(data)
      if (response) {
        entries.value.unshift(response)
        return response
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateEntry = async (id: string, data: UpdateEntryRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await entriesApi.update(id, data)
      if (response) {
        const index = entries.value.findIndex(e => e.id === id)
        if (index !== -1) {
          entries.value[index] = response
        }
        if (currentEntry.value?.id === id) {
          currentEntry.value = response
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

  const deleteEntry = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await entriesApi.delete(id)
      entries.value = entries.value.filter(e => e.id !== id)
      if (currentEntry.value?.id === id) {
        currentEntry.value = null
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    entries,
    currentEntry,
    loading,
    error,
    pagination,
    fetchEntries,
    fetchEntry,
    createEntry,
    updateEntry,
    deleteEntry
  }
})
