import {storeToRefs} from 'pinia'
import {useEntriesStore} from '@/stores/entries'
import {useUiStore} from '@/stores/ui'
import type {CreateEntryRequest, UpdateEntryRequest} from '@/types/entry'

export const useEntries = () => {
  const entriesStore = useEntriesStore()
  const uiStore = useUiStore()
  const {entries, currentEntry, loading, pagination} = storeToRefs(entriesStore)

  const createEntry = async (data: CreateEntryRequest) => {
    try {
      const entry = await entriesStore.createEntry(data)
      uiStore.addNotification({
        type: 'success',
        message: 'Entry created successfully'
      })
      return entry
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Failed to create entry')
      throw error
    }
  }

  const updateEntry = async (id: string, data: UpdateEntryRequest) => {
    try {
      const entry = await entriesStore.updateEntry(id, data)
      uiStore.addNotification({
        type: 'success',
        message: 'Entry updated successfully'
      })
      return entry
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Failed to update entry')
      throw error
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      await entriesStore.deleteEntry(id)
      uiStore.addNotification({
        type: 'success',
        message: 'Entry deleted successfully'
      })
    } catch (error: unknown) {
      uiStore.handleApiError(error, 'Failed to delete entry')
      throw error
    }
  }

  return {
    entries,
    currentEntry,
    loading,
    pagination,
    fetchEntries: entriesStore.fetchEntries,
    fetchEntry: entriesStore.fetchEntry,
    createEntry,
    updateEntry,
    deleteEntry
  }
}
