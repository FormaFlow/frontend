import {storeToRefs} from 'pinia'
import {useEntriesStore} from '@/stores/entries'
import {useUiStore} from '@/stores/ui'
import type {CreateEntryRequest, UpdateEntryRequest} from '@/types/entry'

export const useEntries = () => {
  const entriesStore = useEntriesStore()
  const uiStore = useUiStore()
  const {entries, currentEntry, loading, loadingMore, pagination} = storeToRefs(entriesStore)

  const createEntry = async (data: CreateEntryRequest) => {
    try {
      const entry = await entriesStore.createEntry(data)
      return entry
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Failed to create entry')
      throw error
    }
  }

  const updateEntry = async (id: string, data: UpdateEntryRequest) => {
    try {
      const entry = await entriesStore.updateEntry(id, data)
      return entry
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Failed to update entry')
      throw error
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      await entriesStore.deleteEntry(id)
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Failed to delete entry')
      throw error
    }
  }

  return {
    entries,
    currentEntry,
    loading,
    loadingMore,
    pagination,
    fetchEntries: entriesStore.fetchEntries,
    fetchEntry: entriesStore.fetchEntry,
    fetchPublicEntry: entriesStore.fetchPublicEntry,
    createEntry,
    updateEntry,
    deleteEntry
  }
}
