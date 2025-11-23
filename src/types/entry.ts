export interface Entry {
  id: string
  form_id: string
  data: Record<string, any>
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface CreateEntryRequest {
  form_id: string
  data: Record<string, any>
  tags?: string[]
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
