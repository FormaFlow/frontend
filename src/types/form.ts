export type FormFieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'currency' | 'email'

export interface FormFieldOption {
  label: string
  value: string | number | boolean
}

export interface FormField {
  id: string
  name: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  unit?: string
  options?: FormFieldOption[]
  pattern?: string
  min?: number | string
  max?: number | string
  description?: string
  order: number
}

export interface Form {
  id: string
  name: string
  description?: string
  published: boolean
  fields: FormField[]
  entries_count: number
  created_at: string
  updated_at: string
}

export interface CreateFormRequest {
  name: string
  description?: string
}

export interface UpdateFormRequest {
  name?: string
  description?: string
}

export interface AddFieldRequest {
  name: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  unit?: string
  options?: FormFieldOption[]
  pattern?: string
  min?: number | string
  max?: number | string
  description?: string
  order: number
}

export interface UpdateFieldRequest {
  name?: string
  label?: string
  type?: FormFieldType
  required?: boolean
  placeholder?: string
  unit?: string
  options?: FormFieldOption[]
  pattern?: string
  min?: number | string
  max?: number | string
  description?: string
  order?: number
}
