import client from './client'
import type {
  BulkImportRequest,
  BulkImportResponse,
  CreateEntryRequest,
  Entry,
  UpdateEntryRequest
} from '@/types/entry'

import {PaginatedResponse} from "@/types/api";

export const entriesApi = {
  list(params?: any) {
    return client.get<PaginatedResponse<Entry>>('/entries', params)
  },

  get(id: string) {
    return client.get<Entry>(`/entries/${id}`)
  },

  create(data: CreateEntryRequest) {
    return client.post<Entry>('/entries', data)
  },

  update(id: string, data: UpdateEntryRequest) {
    return client.patch<Entry>(`/entries/${id}`, data)
  },

  delete(id: string) {
    return client.delete(`/entries/${id}`)
  },

  bulkImport(formId: string, data: BulkImportRequest) {
    return client.post<BulkImportResponse>(`/forms/${formId}/entries/import`, data)
  },

  listByForm(formId: string, params?: any) {
    return client.get<PaginatedResponse<Entry>>(`/forms/${formId}/entries`, params)
  },

  stats(formId: string) {
    return client.get<{ stats: EntryStats }>(`/entries/stats`, { form_id: formId }).then(res => res.stats)
  }
}

export type EntryStats = {
  field: string
  sum_today: number
  sum_month: number
}[]
