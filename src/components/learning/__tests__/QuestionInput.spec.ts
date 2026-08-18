import {mount} from '@vue/test-utils'
import {describe, expect, it} from 'vitest'
import QuestionInput from '@/components/learning/QuestionInput.vue'
import type {LearningQuestion} from '@/types/learning'

const choice: LearningQuestion = {
  id: 'q1', prompt: 'Выбери ответ', type: 'single_choice', points: 10,
  options: [{label: 'Один', value: '1'}, {label: 'Два', value: '2'}]
}

describe('QuestionInput', () => {
  it('emits the selected single choice', async () => {
    const wrapper = mount(QuestionInput, {props: {question: choice, modelValue: undefined}})
    await wrapper.findAll('input')[1].setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2'])
  })

  it('adds an option without mutating the multiple-choice model', async () => {
    const question = {...choice, type: 'multiple_choice' as const}
    const selected = ['1']
    const wrapper = mount(QuestionInput, {props: {question, modelValue: selected}})
    await wrapper.findAll('input')[1].setValue(true)
    expect(selected).toEqual(['1'])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['1', '2']])
  })

  it('keeps boolean answers typed as booleans', async () => {
    const question: LearningQuestion = {id: 'q2', prompt: 'Верно?', type: 'boolean', points: 10}
    const wrapper = mount(QuestionInput, {props: {question, modelValue: undefined}})
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })
})
