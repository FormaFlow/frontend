import type {LearningQuestion} from '@/types/learning'

type Option = NonNullable<LearningQuestion['options']>[number]

export function formatLearningAnswer(value: unknown, options: Option[] = []): string {
  if (value === null || value === undefined || value === '') return 'Нет ответа'
  if (typeof value === 'object' && !Array.isArray(value)) {
    const config = value as Record<string, unknown>
    const answers = config.accepted ?? config.correct ?? config.value
    if (config.accepted && Array.isArray(answers)) return answers.map(item => formatLearningAnswer(item, options)).join(' / ')
    return formatLearningAnswer(answers, options)
  }
  if (Array.isArray(value)) {
    if (!value.length) return 'Нет ответа'
    return value.map(item => formatLearningAnswer(item, options)).join(value.length > 1 ? ', ' : '')
  }
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет'
  const option = options.find(item => String(item.value) === String(value))
  return option?.label ?? String(value)
}

export function formatAcceptedAnswers(value: unknown, options: Option[] = []): string {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const config = value as Record<string, unknown>
    const answers = config.accepted ?? config.correct ?? config.value
    if (Array.isArray(answers)) {
      return answers.map(item => formatLearningAnswer(item, options)).join(config.accepted ? ' / ' : ', ')
    }
  }
  return formatLearningAnswer(value, options)
}
