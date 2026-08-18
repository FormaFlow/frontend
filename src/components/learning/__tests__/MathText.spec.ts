import {mount} from '@vue/test-utils'
import {describe, expect, it} from 'vitest'
import MathText from '@/components/learning/MathText.vue'

describe('MathText', () => {
  it('renders inline and display LaTeX with accessible MathML', () => {
    const wrapper = mount(MathText, {props: {text: 'Реши \\(x+2=7\\). \\[S=a^2\\]'}})

    expect(wrapper.text()).toContain('Реши')
    expect(wrapper.findAll('.katex')).toHaveLength(2)
    expect(wrapper.findAll('math')).toHaveLength(2)
    expect(wrapper.html()).toContain('x+2=7')
  })

  it('keeps invalid or plain input visible without throwing', () => {
    expect(() => mount(MathText, {props: {text: 'Текст \\(\\notacommand{\\)'}})).not.toThrow()
    expect(mount(MathText, {props: {text: 'Обычный текст'}}).text()).toBe('Обычный текст')
  })
})
