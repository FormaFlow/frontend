import { ref, reactive } from 'vue'
import { validateForm, type ValidationRules } from '@/utils/validation'

interface UseFormOptions<T extends object> {
  initialState: T
  rules?: ValidationRules
  onSubmit: (data: T) => Promise<void> | void
}

export function useForm<T extends object>(options: UseFormOptions<T>) {
  const form = reactive({ ...options.initialState }) as T
  const errors = reactive<Record<string, string>>({})
  const loading = ref(false)

  const handleSubmit = async () => {
    // Clear errors
    Object.keys(errors).forEach((key) => {
      errors[key] = ''
    })

    if (options.rules) {
      const validation = validateForm(form, options.rules)
      if (!validation.isValid) {
        Object.assign(errors, validation.errors)
        return
      }
    }

    loading.value = true
    try {
      await options.onSubmit(form)
    } catch (error: any) {
      // If the error contains validation errors from backend, we could map them here
      if (error.errors) {
        Object.assign(errors, error.errors)
      }
      throw error // Re-throw to let the caller handle it if needed
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    Object.assign(form, options.initialState)
    Object.keys(errors).forEach((key) => {
      errors[key] = ''
    })
  }

  const setData = (data: Partial<T>) => {
    Object.assign(form, data)
  }

  return {
    form,
    errors,
    loading,
    handleSubmit,
    reset,
    setData
  }
}
