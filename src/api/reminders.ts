import client from './client'

export interface ReminderUser {
  id: string
  name: string
  email: string
}

export interface QuizAssignment {
  id: string
  recipient: ReminderUser
  last_notified_at: string | null
  next_reminder_at: string | null
  completed_at: string | null
}

export const remindersApi = {
  searchUsers(query: string) {
    return client.get<{ users: ReminderUser[] }>('/users/search', { query })
  },

  listAssignments(formId: string) {
    return client.get<{ assignments: QuizAssignment[] }>(`/forms/${formId}/assignments`)
  },

  assign(formId: string, userIds: string[]) {
    return client.post<{ assignments: QuizAssignment[] }>(`/forms/${formId}/assignments`, {
      user_ids: userIds
    })
  }
}
