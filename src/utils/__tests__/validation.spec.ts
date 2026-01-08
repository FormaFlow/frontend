import { describe, it, expect } from 'vitest'
import { validateForm, validators, validateField } from '../validation'

describe('validators', () => {
  it('validates required', () => {
    expect(validators.required('test')).toBe(true)
    expect(validators.required(0)).toBe(true)
    expect(validators.required('')).toBe(false)
    expect(validators.required(null)).toBe(false)
    expect(validators.required(undefined)).toBe(false)
  })

  it('validates email', () => {
    expect(validators.email('test@example.com')).toBe(true)
    expect(validators.email('invalid-email')).toBe(false)
  })

  it('validates min/max length', () => {
    expect(validators.minLength('abc', 3)).toBe(true)
    expect(validators.minLength('ab', 3)).toBe(false)
    expect(validators.maxLength('abc', 3)).toBe(true)
    expect(validators.maxLength('abcd', 3)).toBe(false)
  })
})

describe('validateField', () => {
  it('returns error message for invalid required field', () => {
    expect(validateField('', { required: true })).toBe('This field is required')
  })

  it('returns true for valid required field', () => {
    expect(validateField('test', { required: true })).toBe(true)
  })

  it('returns error for invalid email', () => {
    expect(validateField('not-email', { email: true })).toBe('Please enter a valid email address')
  })
})

describe('validateForm', () => {
  it('validates complete form correctly', () => {
    const data = {
      name: '',
      email: 'invalid',
      age: 10
    }
    
    const rules = {
      name: { required: true },
      email: { required: true, email: true },
      age: { min: 18 }
    }

    const result = validateForm(data, rules)

    expect(result.isValid).toBe(false)
    expect(result.errors.name).toBe('This field is required')
    expect(result.errors.email).toBe('Please enter a valid email address')
    expect(result.errors.age).toBe('Minimum value is 18')
  })

  it('returns valid for correct data', () => {
    const data = {
      name: 'John',
      email: 'john@example.com',
      age: 20
    }
    
    const rules = {
      name: { required: true },
      email: { email: true },
      age: { min: 18 }
    }

    const result = validateForm(data, rules)
    expect(result.isValid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })
})
