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
  list(params?: Record<string, unknown>) {
    return client.get<PaginatedResponse<Entry>>('/entries', params)
  },

  get(id: string) {
    return client.get<Entry>(`/entries/${id}`)
  },

  getPublic(id: string) {
    return client.get<Entry>(`/public/entries/${id}`)
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

  listByForm(formId: string, params?: Record<string, unknown>) {
    return client.get<PaginatedResponse<Entry>>(`/forms/${formId}/entries`, params)
  },

  stats(formId: string, date?: string) {
    return client.get<{ stats: EntryStats }>(`/entries/stats`, { form_id: formId, date }).then(res => res.stats)
  },

  weeklyStats(formId: string, date?: string) {
    return client.get<WeeklyEntryStats>(`/entries/stats/week`, { form_id: formId, date })
  }
}

export type EntryStats = {
  field: string
  sum_today: number
  sum_month: number
}[]

export interface WeeklyEntryStats {
  days: Array<{
    date: string
    stats: Array<{
      field: string
      sum: number
    }>
  }>
  months: Record<string, Array<{
    field: string
    sum_month: number
  }>>
}
