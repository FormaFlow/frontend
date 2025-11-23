export interface ValidationRule {
  required?: boolean
  email?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp | string
  custom?: (value: any) => boolean | string
}

export interface ValidationRules {
  [key: string]: ValidationRule | ValidationRule[]
}

export const validators = {
  required: (value: any) => {
    return value !== undefined && value !== null && value !== ''
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },

  min: (value: number, min: number) => {
    return value >= min
  },

  max: (value: number, max: number) => {
    return value <= max
  },

  minLength: (value: string, min: number) => {
    return value.length >= min
  },

  maxLength: (value: string, max: number) => {
    return value.length <= max
  },

  pattern: (value: string, pattern: RegExp | string) => {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    return regex.test(value)
  }
}

export const validateField = (value: any, rule: ValidationRule): true | string => {
  if (rule.required && !validators.required(value)) {
    return 'This field is required'
  }

  if (value === '' || value === undefined || value === null) {
    return true
  }

  if (rule.email && !validators.email(value)) {
    return 'Please enter a valid email address'
  }

  if (rule.min !== undefined && !validators.min(value, rule.min)) {
    return `Minimum value is ${rule.min}`
  }

  if (rule.max !== undefined && !validators.max(value, rule.max)) {
    return `Maximum value is ${rule.max}`
  }

  if (rule.minLength !== undefined && !validators.minLength(value, rule.minLength)) {
    return `Minimum length is ${rule.minLength}`
  }

  if (rule.maxLength !== undefined && !validators.maxLength(value, rule.maxLength)) {
    return `Maximum length is ${rule.maxLength}`
  }

  if (rule.pattern && !validators.pattern(value, rule.pattern)) {
    return 'Invalid format'
  }

  if (rule.custom) {
    const result = rule.custom(value)
    if (result !== true) {
      return typeof result === 'string' ? result : 'Invalid value'
    }
  }

  return true
}

export const validateForm = (data: Record<string, any>, rules: ValidationRules) => {
  const errors: Record<string, string> = {}

  for (const [field, rule] of Object.entries(rules)) {
    const ruleArray = Array.isArray(rule) ? rule : [rule]
    for (const r of ruleArray) {
      const result = validateField(data[field], r)
      if (result !== true) {
        errors[field] = result
        break
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
