import {describe, expect, it} from 'vitest'
import {formatLearningAnswer} from '@/utils/learningAnswers'

describe('formatLearningAnswer', () => {
  it('shows accepted free-form answers instead of an empty column', () => {
    expect(formatLearningAnswer({accepted: ['одна вторая', 'половина']})).toBe('одна вторая / половина')
  })

  it('uses choice labels and translates booleans', () => {
    const options = [{label: '7/9', value: 'greater'}, {label: '4/9', value: 'less'}]
    expect(formatLearningAnswer({correct: ['greater']}, options)).toBe('7/9')
    expect(formatLearningAnswer({correct: [true]})).toBe('Да')
    expect(formatLearningAnswer(false)).toBe('Нет')
  })

  it('handles empty and multiple values', () => {
    expect(formatLearningAnswer(['a', 'b'])).toBe('a, b')
    expect(formatLearningAnswer(null)).toBe('Нет ответа')
  })
})
