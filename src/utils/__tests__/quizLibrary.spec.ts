import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearQuizDraft,
  getRememberedQuizIds,
  loadQuizDraft,
  rememberQuiz,
  saveQuizDraft
} from '../quizLibrary'

describe('quiz offline library', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('remembers opened quizzes separately for each user', () => {
    rememberQuiz('user-1', 'quiz-1')
    rememberQuiz('user-1', 'quiz-2')
    rememberQuiz('user-1', 'quiz-1')
    rememberQuiz('user-2', 'quiz-3')

    expect(getRememberedQuizIds('user-1')).toEqual(['quiz-1', 'quiz-2'])
    expect(getRememberedQuizIds('user-2')).toEqual(['quiz-3'])
  })

  it('persists and clears a user-scoped quiz draft', () => {
    saveQuizDraft('user-1', 'quiz-1', {
      data: { question: 'Partially typed answer' },
      duration: 42
    })

    expect(loadQuizDraft('user-1', 'quiz-1')).toMatchObject({
      data: { question: 'Partially typed answer' },
      duration: 42
    })
    expect(loadQuizDraft('user-2', 'quiz-1')).toBeNull()

    clearQuizDraft('user-1', 'quiz-1')
    expect(loadQuizDraft('user-1', 'quiz-1')).toBeNull()
  })

  it('ignores malformed local data instead of breaking offline mode', () => {
    localStorage.setItem('formaflow:quiz-library:user-1', '{broken')
    localStorage.setItem('formaflow:quiz-draft:user-1:quiz-1', '{broken')

    expect(getRememberedQuizIds('user-1')).toEqual([])
    expect(loadQuizDraft('user-1', 'quiz-1')).toBeNull()
  })
})
