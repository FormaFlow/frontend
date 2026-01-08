import { describe, it, expect } from 'vitest'
import { formatFieldValue } from '../formatters'

describe('formatFieldValue', () => {
  it('handles null/undefined/empty string', () => {
    expect(formatFieldValue(null, 'text')).toBe('-')
    expect(formatFieldValue(undefined, 'number')).toBe('-')
    expect(formatFieldValue('', 'date')).toBe('-')
  })

  it('formats boolean values', () => {
    expect(formatFieldValue(true, 'boolean')).toBe('✓')
    expect(formatFieldValue(false, 'boolean')).toBe('✗')
  })

  it('formats dates', () => {
    const dateStr = '2023-01-01'
    // Result depends on locale, but typically includes 2023
    expect(formatFieldValue(dateStr, 'date')).toContain('2023')
  })

  it('formats numbers', () => {
    expect(formatFieldValue(1234.56, 'number')).toContain('1,234.56')
    expect(formatFieldValue('1234.56', 'number')).toContain('1,234.56')
    expect(formatFieldValue(100, 'number', 'kg')).toBe('100 kg')
  })

  it('formats currency', () => {
    // ru-RU locale uses space as separator and comma for decimals
    const result = formatFieldValue(1234.5, 'currency')
    // We expect something like "1 234,50" but spaces might be non-breaking
    expect(result).toMatch(/1.*234,50/)
    
    const withUnit = formatFieldValue(100, 'currency', 'USD')
    expect(withUnit).toMatch(/100,00 USD/)
  })

  it('returns value as string for text/email/select', () => {
    expect(formatFieldValue('test@example.com', 'email')).toBe('test@example.com')
    expect(formatFieldValue('Option A', 'select')).toBe('Option A')
    expect(formatFieldValue(123, 'text')).toBe('123')
  })
})
