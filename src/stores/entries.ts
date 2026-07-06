import {defineStore} from 'pinia'
import {ref} from 'vue'
import {entriesApi} from '@/api/entries'
import {db} from '@/db'
import {createLocalId, isNetworkError} from '@/utils/network'
import type {CreateEntryRequest, Entry, UpdateEntryRequest} from '@/types/entry'

type EntriesListRequest = {
  page: number
  formId?: string
  limit?: number
}

export const useEntriesStore = defineStore('entries', () => {
  const entries = ref<Entry[]>([])
  const currentEntry = ref<Entry | null>(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const syncing = ref(false)
  const lastListRequest = ref<EntriesListRequest>({ page: 1 })
  const pagination = ref({
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1
  })

  const fetchEntries = async (page = 1, formId?: string, limit?: number, append = false) => {
    if (!append) {
      lastListRequest.value = { page, formId, limit }
    }

    if (append) {
      loadingMore.value = true
    } else {
      loading.value = true
    }
    error.value = null
    const pageLimit = limit || pagination.value.per_page
    const offset = (page - 1) * pageLimit

    const applyEntries = (nextEntries: Entry[], total: number, responseLimit = pageLimit) => {
      if (append) {
        entries.value = [...entries.value, ...nextEntries]
      } else {
        entries.value = nextEntries
      }

      pagination.value = {
        total,
        per_page: responseLimit,
        current_page: page,
        last_page: Math.max(1, Math.ceil(total / responseLimit))
      }
    }

    const applyCachedEntries = async () => {
      const cached = await db.getCachedEntries({ formId, limit: pageLimit, offset })
      if (cached.total > 0 || !append) {
        applyEntries(cached.entries, cached.total)
      }
      return cached.total > 0
    }

    if (!navigator.onLine) {
      try {
        await applyCachedEntries()
        return
      } finally {
        loading.value = false
        loadingMore.value = false
      }
    }

    const refreshFromApi = async () => {
      const params: { limit: number; offset: number; form_id?: string } = {
        limit: pageLimit,
        offset
      }
      
      if (formId) {
        params.form_id = formId
      }
      
      const response = await entriesApi.list(params)
      
      if (response) {
        const responseEntries = response.entries || []
        applyEntries(responseEntries, response.total || responseEntries.length, response.limit || pageLimit)
        await db.saveEntries(responseEntries)
        await db.pruneCachedEntries()
      }
    }

    if (!append) {
      const hasCachedEntries = await applyCachedEntries()
      if (hasCachedEntries) {
        loading.value = false
        void refreshFromApi().catch(async (err: unknown) => {
          if (!isNetworkError(err)) {
            error.value = (err as Error).message
          }
        })
        return
      }
    }

    if (!append) {
      entries.value = []
    }

    try {
      await refreshFromApi()
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        await applyCachedEntries()
        return
      }

      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  const refreshCurrentEntries = async () => {
    if (!navigator.onLine) return

    const request = lastListRequest.value
    const pageLimit = request.limit || pagination.value.per_page
    const offset = (request.page - 1) * pageLimit
    const params: { limit: number; offset: number; form_id?: string } = {
      limit: pageLimit,
      offset
    }

    if (request.formId) {
      params.form_id = request.formId
    }

    try {
      const response = await entriesApi.list(params)
      if (!response) return

      const responseEntries = response.entries || []
      entries.value = responseEntries
      pagination.value = {
        total: response.total || responseEntries.length,
        per_page: response.limit || pageLimit,
        current_page: request.page,
        last_page: Math.max(1, Math.ceil((response.total || responseEntries.length) / (response.limit || pageLimit)))
      }
      await db.saveEntries(responseEntries)
      await db.pruneCachedEntries()
    } catch (err: unknown) {
      if (!isNetworkError(err)) {
        error.value = (err as Error).message
      }
    }
  }

  const fetchEntry = async (id: string) => {
    loading.value = true
    error.value = null

    if (!navigator.onLine) {
      const cached = await db.getCachedEntry(id)
      if (cached) {
        currentEntry.value = cached
      }
      loading.value = false
      return
    }

    try {
      const response = await entriesApi.get(id)
      if (response) {
        currentEntry.value = response
        await db.saveEntries([response])
      }
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        const cached = await db.getCachedEntry(id)
        if (cached) {
          currentEntry.value = cached
          return
        }
      }

      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchPublicEntry = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await entriesApi.getPublic(id)
      if (response) {
        currentEntry.value = response
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const queuePendingEntry = async (data: CreateEntryRequest) => {
    const createdAt = data.created_at || new Date().toISOString()
    const localEntryId = createLocalId('pending')
    const pendingEntry = JSON.parse(JSON.stringify({
      ...data,
      created_at: createdAt,
      local_entry_id: localEntryId,
      queued_at: new Date().toISOString()
    }))

    await db.savePendingEntry(pendingEntry)

    const optimisticEntry: Entry = {
      id: localEntryId,
      form_id: data.form_id,
      data: data.data,
      tags: data.tags,
      duration: data.duration,
      created_at: createdAt,
      updated_at: createdAt
    }

    entries.value.unshift(optimisticEntry)
    await db.saveEntries([{ ...optimisticEntry, pending: true }])
    return null
  }

  const createEntry = async (data: CreateEntryRequest) => {
    loading.value = true
    error.value = null

    if (!navigator.onLine) {
      try {
        return await queuePendingEntry(data)
      } finally {
        loading.value = false
      }
    }

    try {
      const response = await entriesApi.create(data)
      if (response) {
        entries.value.unshift(response)
        await db.saveEntries([response])
        return response
      }
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        return queuePendingEntry(data)
      }
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  const syncPendingEntries = async () => {
    if (!navigator.onLine || syncing.value) return

    syncing.value = true
    const pending = await db.getPendingEntries()
    try {
      for (const entry of pending) {
        try {
          const { id, local_entry_id: localEntryId, queued_at, ...data } = entry
          void queued_at
          const response = await entriesApi.create(data)
          if (response && id) {
            await db.removePendingEntry(id)
            if (localEntryId) {
              await db.deleteCachedEntry(localEntryId)
              entries.value = entries.value.filter(item => item.id !== localEntryId)
            }
            await db.saveEntries([response])
            entries.value = [response, ...entries.value.filter(item => item.id !== response.id)]
          }
        } catch (err) {
          console.error('Failed to sync entry:', err)
        }
      }
    } finally {
      syncing.value = false
    }
  }

  const loadCachedEntries = async (formId?: string, limit = pagination.value.per_page) => {
    const cached = await db.getCachedEntries({ formId, limit, offset: 0 })
    entries.value = cached.entries
    pagination.value = {
      total: cached.total,
      per_page: limit,
      current_page: 1,
      last_page: Math.max(1, Math.ceil(cached.total / limit))
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
        await db.saveEntries([response])
        return response
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
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
      await db.deleteCachedEntry(id)
      if (currentEntry.value?.id === id) {
        currentEntry.value = null
      }
    } catch (err: unknown) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    entries,
    currentEntry,
    loading,
    loadingMore,
    error,
    pagination,
    syncing,
    fetchEntries,
    refreshCurrentEntries,
    fetchEntry,
    fetchPublicEntry,
    createEntry,
    syncPendingEntries,
    loadCachedEntries,
    updateEntry,
    deleteEntry
  }
})
