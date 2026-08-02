export type PaymentPlanType = 'one_off' | 'recurring' | 'installment'
export type PaymentScheduleType = 'one_off' | 'monthly' | 'interval' | 'manual'
export type PaymentPlanStatus = 'active' | 'closed' | 'cancelled'
export type PaymentOccurrenceStatus = 'planned' | 'paid' | 'cancelled'

export interface PaymentCategory {
  id: string
  name: string
  color?: string | null
  plans_count?: number
}

export interface PaymentPlan {
  id: string
  category_id?: string | null
  category?: PaymentCategory | null
  name: string
  payee?: string | null
  type: PaymentPlanType
  status: PaymentPlanStatus
  currency: string
  schedule_type: PaymentScheduleType
  starts_on?: string | null
  ends_on?: string | null
  day_of_month?: number | null
  interval_days?: number | null
  total_installments?: number | null
  default_nominal_amount?: string | null
  default_expected_amount?: string | null
  fee_percent: string
  fee_fixed: string
  notes?: string | null
  paid_count?: number
  planned_count?: number
  occurrences_count?: number
}

export interface PaymentOccurrence {
  id: string
  plan_id: string
  plan: PaymentPlan
  due_on: string
  sequence_no?: number | null
  total_count?: number | null
  kind: 'scheduled' | 'settlement'
  nominal_amount?: string | null
  expected_amount?: string | null
  actual_amount?: string | null
  status: PaymentOccurrenceStatus
  paid_at?: string | null
  notes?: string | null
}

export interface PaymentSummary {
  overdue_count: number
  due_soon_count: number
  expected_this_month: string
  paid_this_month: string
}

export interface PaymentOverview {
  summary: PaymentSummary
  occurrences: PaymentOccurrence[]
}

export interface PaymentOccurrenceInput {
  due_on: string
  sequence_no?: number | null
  total_count?: number | null
  nominal_amount?: string | null
  expected_amount?: string | null
}

export interface PaymentPlanInput {
  category_id?: string | null
  name: string
  payee?: string | null
  type: PaymentPlanType
  currency: string
  schedule_type: PaymentScheduleType
  starts_on?: string | null
  ends_on?: string | null
  day_of_month?: number | null
  interval_days?: number | null
  total_installments?: number | null
  default_nominal_amount?: string | null
  default_expected_amount?: string | null
  fee_percent?: string | null
  fee_fixed?: string | null
  notes?: string | null
  effective_from?: string | null
  occurrences?: PaymentOccurrenceInput[]
}
