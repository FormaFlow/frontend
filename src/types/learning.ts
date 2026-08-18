export interface WorkspaceSummary {
  id: string
  name: string
  slug: string
  role: 'owner' | 'admin' | 'learner' | 'member'
  timezone: string
  modules: Record<string, boolean>
}

export interface LearningQuestion {
  id: string
  prompt: string
  type: 'single_choice' | 'multiple_choice' | 'short_text' | 'number' | 'boolean'
  options?: Array<{label: string; value: string}>
  points: number
  topic?: string | null
  explanation?: string | null
  answer_config?: Record<string, unknown>
  prompt_media_id?: string | null
  prompt_media_url?: string | null
}

export interface AssessmentSummary {
  id: string
  title: string
  description?: string | null
  subject: string
  purpose: string
  target_grade: number
  coverage_from_grade: number
  coverage_to_grade: number
  status: string
  current_version: number
}

export interface TodayPayload {
  assignments: Array<{id: string; title: string; subject_code: string; status: string; due_at?: string | null}>
  reviews_due: number
  xp_total: number
  streak: {current: number; longest: number}
  achievements: string[]
}

export interface AttemptPayload {
  attempt: {id: string; assignment_id: string; status: string; started_at: string}
  assessment: {title: string; description?: string; max_points: number; questions: LearningQuestion[]}
}

export interface AttemptResult {
  attempt_id: string
  score: number
  max_points: number
  xp_total: number
  streak: {current: number; longest: number}
  questions: Array<LearningQuestion & {
    answer: unknown
    is_correct: boolean
    points_awarded: number
    max_points: number
    correct_answer: Record<string, unknown>
  }>
}

export interface LearnerProgress {
  id: string
  name: string
  login: string
  target_grade: number
  assignments: {total: number; completed: number; overdue: number}
  attempts_completed: number
  average_percent: number
  reviews_due: number
  xp_total: number
  streak: {current: number; longest: number}
  last_activity_at?: string | null
}
