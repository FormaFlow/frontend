import { defineStore } from 'pinia'
import { ref } from 'vue'
import { entriesApi } from '@/api/entries'
import type { Entry, CreateEntryRequest, UpdateEntryRequest } from '@/types/entry'

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
      const params = { page }
      if (formId) params.form_id = formId
      const response = await entriesApi.list(params)
      if (response.data) {
        entries.value = response.data.data
        pagination.value = response.data.pagination
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
      if (response.data) {
        currentEntry.value = response.data
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
      if (response.data) {
        entries.value.unshift(response.data)
        return response.data
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
      if (response.data) {
        const index = entries.value.findIndex(e => e.id === id)
        if (index !== -1) {
          entries.value[index] = response.data
        }
        if (currentEntry.value?.id === id) {
          currentEntry.value = response.data
        }
        return response.data
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
