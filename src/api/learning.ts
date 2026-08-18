import client from './client'
import type {
  AssessmentSummary,
  AttemptPayload,
  AttemptResult,
  LearnerProgress,
  LearningQuestion,
  TodayPayload,
  WorkspaceSummary
} from '@/types/learning'

export const workspaceApi = {
  list: () => client.get<{workspaces: WorkspaceSummary[]}>('workspaces'),
  learners: (workspaceId: string) => client.get<{learners: Array<{id: string; name: string; login: string; target_grade: number; timezone: string}>}>(`workspaces/${workspaceId}/learners`),
  createLearner: (workspaceId: string, data: {name: string; login: string; pin: string; target_grade: number}) =>
    client.post(`workspaces/${workspaceId}/learners`, data),
  invite: (workspaceId: string, data: {email: string; role: 'admin' | 'member'}) =>
    client.post<{accept_url: string}>(`workspaces/${workspaceId}/invitations`, data),
  acceptInvitation: (token: string) => client.post<{workspace_id: string; role: string}>('workspaces/invitations/accept', {token}),
  updateModule: (workspaceId: string, module: string, enabled: boolean) => client.patch<{module: {key: string; enabled: boolean}}>(`workspaces/${workspaceId}/modules/${module}`, {enabled})
}

export const learningApi = {
  today: (workspaceId: string) => client.get<TodayPayload>(`workspaces/${workspaceId}/learning/today`),
  startAttempt: (workspaceId: string, assignmentId: string) =>
    client.post<AttemptPayload>(`workspaces/${workspaceId}/learning/assignments/${assignmentId}/attempts`),
  submitAttempt: (workspaceId: string, attemptId: string, responses: Record<string, unknown>, idempotencyKey: string) =>
    client.post<{result: AttemptResult}>(`workspaces/${workspaceId}/learning/attempts/${attemptId}/submit`, {
      responses, idempotency_key: idempotencyKey
    }),
  dueReviews: (workspaceId: string) => client.get<{reviews: Array<{id: string; stage: number; question: LearningQuestion}>}>(`workspaces/${workspaceId}/learning/reviews/due`),
  answerReview: (workspaceId: string, reviewId: string, answer: unknown, idempotencyKey: string) =>
    client.post(`workspaces/${workspaceId}/learning/reviews/${reviewId}/answer`, {answer, idempotency_key: idempotencyKey}),
  assessments: (workspaceId: string) => client.get<{assessments: AssessmentSummary[]}>(`workspaces/${workspaceId}/learning/assessments`),
  editor: (workspaceId: string, assessmentId: string) => client.get<{assessment: AssessmentSummary & {questions: LearningQuestion[]}}>(`workspaces/${workspaceId}/learning/assessments/${assessmentId}/editor`),
  updateQuestion: (workspaceId: string, assessmentId: string, questionId: string, data: Partial<LearningQuestion>) =>
    client.patch(`workspaces/${workspaceId}/learning/assessments/${assessmentId}/questions/${questionId}`, data),
  publish: (workspaceId: string, assessmentId: string) => client.post(`workspaces/${workspaceId}/learning/assessments/${assessmentId}/publish`),
  importPreview: (workspaceId: string, pack: unknown) => client.post(`workspaces/${workspaceId}/learning/import/preview`, pack),
  importPack: (workspaceId: string, pack: unknown) => client.post(`workspaces/${workspaceId}/learning/import`, pack),
  uploadMedia: (workspaceId: string, file: File, altText: string) => {
    const data = new FormData(); data.append('file', file); data.append('alt_text', altText)
    return client.postFormData<{asset: {id: string; url: string; alt_text: string}}>(`workspaces/${workspaceId}/learning/media`, data)
  },
  library: (workspaceId: string) => client.get<{packs: Array<{id: string; title: string; description: string; questions: number; target_grade: number}>}>(`workspaces/${workspaceId}/learning/library`),
  installPack: (workspaceId: string, packId: string) => client.post(`workspaces/${workspaceId}/learning/library/${packId}/install`),
  assign: (workspaceId: string, data: {assessment_id: string; learner_user_id: string; due_at?: string}) =>
    client.post<{assignment: {id: string}; notification_sent: boolean}>(`workspaces/${workspaceId}/learning/assignments`, data),
  progress: (workspaceId: string) => client.get<{learners: LearnerProgress[]}>(`workspaces/${workspaceId}/learning/progress`),
  timeline: (workspaceId: string, learnerId: string) => client.get<{attempts: Array<{id: string; assessment_title: string; subject_code: string; score: number; max_points: number; completed_at: string}>}>(`workspaces/${workspaceId}/learning/progress/${learnerId}`),
  schedule: (workspaceId: string, learnerId: string) => client.get<{schedule: StudySchedule | null}>(`workspaces/${workspaceId}/learning/schedules/${learnerId}`),
  saveSchedule: (workspaceId: string, learnerId: string, data: Omit<StudySchedule, 'id' | 'learner_user_id' | 'guardian_user_id'>) =>
    client.put<{schedule: StudySchedule}>(`workspaces/${workspaceId}/learning/schedules/${learnerId}`, data),
  askTutor: (workspaceId: string, attemptId: string, questionId: string, message: string) =>
    client.post<{tutor: {answer: string; suggestions: string[]; provider: string}}>(`workspaces/${workspaceId}/learning/tutor/explain`, {
      attempt_id: attemptId, question_id: questionId, message
    })
}

export interface StudySchedule {
  id: string
  learner_user_id: string
  guardian_user_id: string
  timezone: string
  daily_time: string
  weekdays: number[]
  guardian_delay_minutes: number
  enabled: boolean
}
