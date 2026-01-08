import client from './client'
import axios from 'axios'
import type { Form } from '@/types/form'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export interface ReportParams {
  form_id: string
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  field?: string
  date_from?: string
  date_to?: string
  tags?: string[]
}

export interface TimeSeriesParams {
  form_id: string
  field: string
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  period: 'daily' | 'weekly' | 'monthly'
  date_from?: string
  date_to?: string
}

export interface GroupedParams {
  form_id: string
  group_by: string
  field: string
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  date_from?: string
  date_to?: string
}

export interface DashboardSummary {
  forms: Form[]
  total_entries: number
  summary_by_form: Record<string, number>
}

export interface TrendsData {
  weekly_trends: { week: string; count: number }[]
  monthly_trends: { month: string; count: number }[]
}

export interface SummaryParams {
  form_id: string
  date_from?: string
  date_to?: string
}

export interface MultiTimeSeriesParams {
  form_id: string
  period: 'daily' | 'weekly' | 'monthly'
  date_from?: string
  date_to?: string
}

export interface SummaryStat {
  field: string
  label: string
  type: string
  sum: number
  avg: number
  min: number
  max: number
}

export interface SummaryResponse {
  total_entries: number
  stats: SummaryStat[]
}

export interface MultiTimeSeriesResponse {
  data: Record<string, string | number>[] // date + field: value
  fields: { name: string; label: string }[]
}

export interface WeeklySummaryResponse {
  week_start: string
  week_end: string
  total_income: number
  total_expense: number
  net: number
  count: number
}

export interface MonthlySummaryResponse {
  month: string
  total_income: number
  total_expense: number
  net: number
  count: number
}

export interface BudgetReportResponse {
  total_income: number
  total_expense: number
  balance: number
  savings_rate: number
}

export interface MedicineReportResponse {
  medicines: Record<string, number>
  total_consumption: number
  frequency: number
}

export interface WeightReportResponse {
  current_weight: number
  starting_weight: number
  change: number
  trend: { date: string; weight: number }[]
}

function getPredefinedReport(type: 'budget', params?: Record<string, unknown>): Promise<BudgetReportResponse>;
function getPredefinedReport(type: 'medicine', params?: Record<string, unknown>): Promise<MedicineReportResponse>;
function getPredefinedReport(type: 'weight', params?: Record<string, unknown>): Promise<WeightReportResponse>;
function getPredefinedReport(type: 'budget' | 'medicine' | 'weight', params: Record<string, unknown> = {}) {
  const query = new URLSearchParams(params as Record<string, string>).toString()
  return client.get<BudgetReportResponse | MedicineReportResponse | WeightReportResponse>(
    `/reports/predefined/${type}?${query}`
  )
}

export default {
  generate(params: ReportParams) {
    return client.post<{ result: number; aggregation: string; field: string }>('/reports', params)
  },

  summary(params: SummaryParams) {
    return client.post<SummaryResponse>('/reports/summary', params)
  },

  multiTimeSeries(params: MultiTimeSeriesParams) {
    return client.post<MultiTimeSeriesResponse>('/reports/multi-time-series', params)
  },

  timeSeries(params: TimeSeriesParams) {
    return client.post<{ data: { date: string; value: number }[] }>('/reports/time-series', params)
  },

  grouped(params: GroupedParams) {
    return client.post<{ groups: { category: string; value: number }[] }>(
      '/reports/grouped',
      params
    )
  },

  async export(params: Record<string, unknown>) {
    // Direct axios usage for Blob response and config that ApiClient doesn't expose
    const token = localStorage.getItem('auth_token')
    const response = await axios.post(`${API_BASE_URL}/reports/export`, params, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  getWeeklySummary(formId: string) {
    return client.get<WeeklySummaryResponse>(`/reports/weekly-summary?form_id=${formId}`)
  },

  getMonthlySummary(formId: string, month?: string) {
    const query = month ? `&month=${month}` : ''
    return client.get<MonthlySummaryResponse>(`/reports/monthly-summary?form_id=${formId}${query}`)
  },

  getPredefinedReport,

  getDashboardWeek() {
    return client.get<DashboardSummary>('/dashboard/week')
  },

  getDashboardMonth() {
    return client.get<DashboardSummary>('/dashboard/month')
  },

  getDashboardTrends() {
    return client.get<TrendsData>('/dashboard/trends')
  }
}