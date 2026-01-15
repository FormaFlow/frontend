import Dexie, { type Table } from 'dexie'
import type { Form } from '@/types/form'
import type { CreateEntryRequest } from '@/types/entry'

export interface PendingEntry extends CreateEntryRequest {
  id?: number
  created_at: string
}

export class FormaFlowDatabase extends Dexie {
  forms!: Table<Form>
  pendingEntries!: Table<PendingEntry>

  constructor() {
    super('FormaFlowDB')
    this.version(1).stores({
      forms: 'id',
      pendingEntries: '++id, form_id'
    })
  }

  async saveForms(forms: Form[]) {
    return this.forms.bulkPut(forms)
  }

  async getForms() {
    return this.forms.toArray()
  }

  async savePendingEntry(entry: PendingEntry) {
    return this.pendingEntries.add(entry)
  }

  async getPendingEntries() {
    return this.pendingEntries.toArray()
  }

  async removePendingEntry(id: number) {
    return this.pendingEntries.delete(id)
  }
}

export const db = new FormaFlowDatabase()
