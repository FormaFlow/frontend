export interface QuizDraft {
  data: Record<string, unknown>
  duration: number
  updatedAt: string
}

const libraryKey = (userId: string) => `formaflow:quiz-library:${userId}`
const draftKey = (userId: string, formId: string) => `formaflow:quiz-draft:${userId}:${formId}`

export function getRememberedQuizIds(userId: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(libraryKey(userId)) || '[]')
    return Array.isArray(value) ? value.filter(id => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function rememberQuiz(userId: string, formId: string): void {
  const ids = getRememberedQuizIds(userId)
  if (!ids.includes(formId)) {
    localStorage.setItem(libraryKey(userId), JSON.stringify([...ids, formId]))
  }
}

export function saveQuizDraft(
  userId: string,
  formId: string,
  draft: Omit<QuizDraft, 'updatedAt'>
): void {
  localStorage.setItem(draftKey(userId, formId), JSON.stringify({
    ...draft,
    updatedAt: new Date().toISOString()
  }))
}

export function loadQuizDraft(userId: string, formId: string): QuizDraft | null {
  try {
    const value = JSON.parse(localStorage.getItem(draftKey(userId, formId)) || 'null')
    if (!value || typeof value !== 'object' || !value.data || typeof value.data !== 'object') {
      return null
    }
    return {
      data: value.data,
      duration: Number.isFinite(value.duration) ? value.duration : 0,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : ''
    }
  } catch {
    return null
  }
}

export function hasQuizDraft(userId: string, formId: string): boolean {
  return loadQuizDraft(userId, formId) !== null
}

export function clearQuizDraft(userId: string, formId: string): void {
  localStorage.removeItem(draftKey(userId, formId))
}
