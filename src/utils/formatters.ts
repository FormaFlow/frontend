import type { FormFieldType } from '@/types/form'

export const formatFieldValue = (value: unknown, type: FormFieldType, unit?: string): string => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  switch (type) {
    case 'boolean':
      return value ? '✓' : '✗'
    case 'date':
      return new Date(String(value)).toLocaleDateString()
    case 'number': {
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      return isNaN(num) ? String(value) : `${num.toLocaleString()}${unit ? ' ' + unit : ''}`
    }
    case 'currency': {
      const curr = typeof value === 'number' ? value : parseFloat(String(value))
      return isNaN(curr)
        ? String(value)
        : `${curr.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${
            unit ? ' ' + unit : ''
          }`
    }
    case 'email':
    case 'select':
    case 'text':
    default:
      return String(value)
  }
}
