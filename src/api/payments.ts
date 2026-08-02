import client from '@/api/client'
import type {
  PaymentCategory,
  PaymentOccurrence,
  PaymentOverview,
  PaymentPlan,
  PaymentPlanInput
} from '@/types/payment'

export const paymentsApi = {
  overview(params?: Record<string, unknown>) {
    return client.get<PaymentOverview>('/payments/overview', params)
  },
  categories() {
    return client.get<{categories: PaymentCategory[]}>('/payments/categories')
  },
  createCategory(data: {name: string, color?: string}) {
    return client.post<PaymentCategory>('/payments/categories', data)
  },
  plans(status?: string) {
    return client.get<{plans: PaymentPlan[]}>('/payments/plans', status ? {status} : undefined)
  },
  createPlan(data: PaymentPlanInput) {
    return client.post<PaymentPlan>('/payments/plans', data)
  },
  updatePlan(id: string, data: Partial<PaymentPlanInput>) {
    return client.patch<PaymentPlan>(`/payments/plans/${id}`, data)
  },
  deletePlan(id: string) {
    return client.delete(`/payments/plans/${id}`)
  },
  pay(id: string, data: {paid_at: string, actual_amount: string}) {
    return client.post<PaymentOccurrence>(`/payments/occurrences/${id}/pay`, data)
  },
  reopen(id: string) {
    return client.post<PaymentOccurrence>(`/payments/occurrences/${id}/reopen`)
  },
  closePlan(id: string, data: {paid_at: string, actual_amount: string, notes?: string}) {
    return client.post<PaymentPlan>(`/payments/plans/${id}/close`, data)
  }
}
