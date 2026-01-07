export type FormFieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'currency' | 'email'

export interface FormFieldOption {
  label: string
  value: string | number | boolean
}

export interface FormField {
  id: string
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
  correctAnswer?: string
  points?: number
}

export interface Form {
  id: string
  name: string
  description?: string
  published: boolean
  is_quiz: boolean
  single_submission: boolean
  fields: FormField[]
  entries_count: number
  created_at: string
  updated_at: string
}

export interface CreateFormRequest {
  name: string
  description?: string
  is_quiz?: boolean
  single_submission?: boolean
}

export interface UpdateFormRequest {
  name?: string
  description?: string
  is_quiz?: boolean
  single_submission?: boolean
}

export interface AddFieldRequest {
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
  correctAnswer?: string
  points?: number
}

export interface UpdateFieldRequest {
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
  correctAnswer?: string
  points?: number
}
