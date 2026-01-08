import { describe, it, expect, vi } from 'vitest'
import { useForm } from '../useForm'
import { nextTick } from 'vue'

describe('useForm', () => {
  it('initializes with default values', () => {
    const { form } = useForm({
      initialState: { name: 'test' },
      onSubmit: () => {}
    })
    expect(form.name).toBe('test')
  })

  it('validates before submit', async () => {
    const onSubmit = vi.fn()
    const { form, handleSubmit, errors } = useForm({
      initialState: { name: '' },
      rules: { name: { required: true } },
      onSubmit
    })

    await handleSubmit()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(errors.name).toBe('This field is required')

    form.name = 'Valid Name'
    await handleSubmit()

    expect(onSubmit).toHaveBeenCalled()
    expect(errors.name).toBe('') // cleared
  })

  it('handles loading state', async () => {
    const onSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10)))
    const { handleSubmit, loading } = useForm({
      initialState: {},
      onSubmit
    })

    const submitPromise = handleSubmit()
    expect(loading.value).toBe(true)
    
    await submitPromise
    expect(loading.value).toBe(false)
  })

  it('resets form', () => {
    const { form, reset } = useForm({
      initialState: { name: 'initial' },
      onSubmit: () => {}
    })

    form.name = 'changed'
    reset()
    expect(form.name).toBe('initial')
  })

  it('sets data using setData', () => {
    const { form, setData } = useForm({
      initialState: { name: 'initial', age: 10 },
      onSubmit: () => {}
    })

    setData({ name: 'updated' })
    expect(form.name).toBe('updated')
    expect(form.age).toBe(10) // preserved
  })
})
