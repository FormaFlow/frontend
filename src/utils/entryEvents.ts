export const ENTRY_CHANGE_STORAGE_KEY = 'formaflow:entry-change'
const ENTRY_CHANGE_EVENT = 'formaflow:entry-change-local'

export interface EntryChangeEvent {
  formId: string
  changedAt: number
  nonce: string
}

export function publishEntryChange(formId: string): void {
  const detail: EntryChangeEvent = {
    formId,
    changedAt: Date.now(),
    nonce: Math.random().toString(36).slice(2),
  }

  window.dispatchEvent(new CustomEvent<EntryChangeEvent>(ENTRY_CHANGE_EVENT, {detail}))
  localStorage.setItem(ENTRY_CHANGE_STORAGE_KEY, JSON.stringify(detail))
}

export function subscribeToEntryChanges(listener: (event: EntryChangeEvent) => void): () => void {
  const handleLocal = (event: Event) => {
    listener((event as CustomEvent<EntryChangeEvent>).detail)
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== ENTRY_CHANGE_STORAGE_KEY || !event.newValue) return

    try {
      const detail = JSON.parse(event.newValue) as EntryChangeEvent
      if (detail.formId) listener(detail)
    } catch {
      // Ignore malformed events from old clients or manual localStorage edits.
    }
  }

  window.addEventListener(ENTRY_CHANGE_EVENT, handleLocal)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(ENTRY_CHANGE_EVENT, handleLocal)
    window.removeEventListener('storage', handleStorage)
  }
}
