import Dexie, { type Table } from 'dexie'
import type { Form, FormSummary } from '@/types/form'
import type { CreateEntryRequest, Entry } from '@/types/entry'

export interface PendingEntry extends CreateEntryRequest {
  id?: number
  created_at: string
  local_entry_id?: string
  queued_at?: string
}

export interface CachedEntry extends Entry {
  pending?: boolean
}

export interface CachedEntryQuery {
  formId?: string
  limit: number
  offset: number
  dateFrom?: string
  dateTo?: string
}

export interface CacheItem<T = unknown> {
  key: string
  value: T
  updated_at: string
}

interface CachedForm extends Form {
  definition_cached?: boolean
}

export class FormaFlowDatabase extends Dexie {
  forms!: Table<CachedForm>
  pendingEntries!: Table<PendingEntry>
  entries!: Table<CachedEntry>
  cacheItems!: Table<CacheItem>

  constructor() {
    super('FormaFlowDB')
    this.version(1).stores({
      forms: 'id',
      pendingEntries: '++id, form_id'
    })
    this.version(2).stores({
      forms: 'id',
      pendingEntries: '++id, form_id, created_at, local_entry_id',
      entries: 'id, form_id, created_at',
      cacheItems: 'key'
    })
  }

  async saveForms(forms: Form[]): Promise<void> {
    if (forms.length === 0) return
    await this.forms.bulkPut(forms.map(form => ({ ...form, definition_cached: true })))
  }

  async saveFormSummaries(forms: FormSummary[]): Promise<void> {
    if (forms.length === 0) return

    await this.transaction('rw', this.forms, async () => {
      for (const summary of forms) {
        const cached = await this.forms.get(summary.id)
        const definitionCached = cached?.definition_cached
          ?? Boolean(cached?.fields?.length || summary.fields_count === 0)

        await this.forms.put({
          ...cached,
          ...summary,
          fields: cached?.fields || [],
          definition_cached: definitionCached
        })
      }
    })
  }

  async getFormDefinition(id: string): Promise<Form | undefined> {
    const cached = await this.forms.get(id)
    if (!cached) return undefined

    const hasDefinition = cached.definition_cached
      ?? Boolean(cached.fields?.length || cached.fields_count === 0)

    return hasDefinition ? cached : undefined
  }

  async getForms(filters: { search?: string; isQuiz?: boolean; limit?: number; offset?: number } = {}) {
    const search = filters.search?.trim().toLowerCase()
    let forms: FormSummary[] = (await this.forms.toArray()).map(form => ({
      ...form,
      fields_count: form.fields_count ?? form.fields?.length ?? 0,
      entries_count: form.entries_count ?? 0,
      created_at: form.created_at ?? '',
      updated_at: form.updated_at ?? form.created_at ?? ''
    }))

    if (search) {
      forms = forms.filter(form => {
        const name = form.name?.toLowerCase() || ''
        const description = form.description?.toLowerCase() || ''
        return name.includes(search) || description.includes(search)
      })
    }

    if (filters.isQuiz !== undefined) {
      forms = forms.filter(form => Boolean(form.is_quiz) === filters.isQuiz)
    }

    forms.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    const total = forms.length
    const offset = filters.offset || 0
    const limit = filters.limit || total

    return {
      forms: forms.slice(offset, offset + limit),
      total
    }
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

  async saveEntries(entries: CachedEntry[]): Promise<void> {
    if (entries.length === 0) return
    await this.entries.bulkPut(entries.map(entry => JSON.parse(JSON.stringify(entry))))
  }

  async deleteCachedEntry(id: string): Promise<void> {
    await this.entries.delete(id)
  }

  async getCachedEntry(id: string): Promise<CachedEntry | undefined> {
    return this.entries.get(id)
  }

  async getCachedEntries(query: CachedEntryQuery): Promise<{ entries: CachedEntry[]; total: number }> {
    let entries = await this.entries.toArray()

    if (query.formId) {
      entries = entries.filter(entry => entry.form_id === query.formId)
    }

    if (query.dateFrom) {
      const from = new Date(query.dateFrom).getTime()
      entries = entries.filter(entry => new Date(entry.created_at).getTime() >= from)
    }

    if (query.dateTo) {
      const to = new Date(`${query.dateTo}T23:59:59`).getTime()
      entries = entries.filter(entry => new Date(entry.created_at).getTime() <= to)
    }

    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      entries: entries.slice(query.offset, query.offset + query.limit),
      total: entries.length
    }
  }

  async pruneCachedEntries(daysToKeep = 14): Promise<void> {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    const oldEntries = await this.entries
      .filter(entry => !entry.pending && new Date(entry.created_at).getTime() < cutoff)
      .primaryKeys()

    if (oldEntries.length > 0) {
      await this.entries.bulkDelete(oldEntries as string[])
    }
  }

  async setCacheItem<T>(key: string, value: T): Promise<void> {
    await this.cacheItems.put({
      key,
      value: JSON.parse(JSON.stringify(value)),
      updated_at: new Date().toISOString()
    })
  }

  async getCacheItem<T>(key: string): Promise<T | null> {
    const item = await this.cacheItems.get(key)
    return (item?.value as T | undefined) || null
  }
}

export const db = new FormaFlowDatabase()
