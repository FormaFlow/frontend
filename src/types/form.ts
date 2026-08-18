export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select' | 'currency' | 'email'
export type TrendDirection = 'neutral' | 'increase_good' | 'decrease_good'

export interface FormFieldOption {
  label: string
  value: string | number | boolean
}

export interface FormField {
  id: string
  label: string
  type: FormFieldType
  sum_values?: boolean
  trend_direction?: TrendDirection
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

interface FormMetadata {
  id: string
  name: string
  description?: string
  published: boolean
  is_quiz: boolean
  timer_enabled?: boolean
  single_submission: boolean
  quick_entry_favorite: boolean
  reminder_interval_minutes?: number | null
}

export interface FormSummary extends FormMetadata {
  fields_count: number
  entries_count: number
  created_at: string
  updated_at: string
}

export type QuizAccessType = 'owned' | 'assigned' | 'opened'

export interface QuizSummary extends FormSummary {
  access_type: QuizAccessType
  completed_at: string | null
}

export interface Form extends FormMetadata {
  fields: FormField[]
  fields_count: number
  entries_count?: number
  created_at?: string
  updated_at?: string
}

export interface CreateFormResponse {
  id: string
}

export interface CreateFormRequest {
  name: string
  description?: string
  is_quiz?: boolean
  timer_enabled?: boolean
  single_submission?: boolean
  quick_entry_favorite?: boolean
  reminder_interval_minutes?: number | null
}

export interface UpdateFormRequest {
  name?: string
  description?: string
  is_quiz?: boolean
  timer_enabled?: boolean
  single_submission?: boolean
  quick_entry_favorite?: boolean
  reminder_interval_minutes?: number | null
}

export interface AddFieldRequest {
  label: string
  type: FormFieldType
  sum_values?: boolean
  trend_direction?: TrendDirection
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
  sum_values?: boolean
  trend_direction?: TrendDirection
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
