import type { Form } from './form'

export interface Entry {
  id: string
  form_id: string
  data: Record<string, any>
  tags?: string[]
  score?: number
  duration?: number
  created_at: string
  updated_at: string
  form?: Form
}

export interface CreateEntryRequest {
  form_id: string
  data: Record<string, any>
  tags?: string[]
  duration?: number
}

export interface UpdateEntryRequest {
  data: Record<string, any>
  tags?: string[]
}

export interface BulkImportRequest {
  entries: CreateEntryRequest[]
}

export interface BulkImportResponse {
  imported: number
  failed: number
  errors?: Record<number, string>
}
