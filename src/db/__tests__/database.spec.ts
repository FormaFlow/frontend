import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../index'

describe('Database Service', () => {
  beforeEach(async () => {
    await db.forms.clear()
    await db.pendingEntries.clear()
    await db.entries.clear()
    await db.cacheItems.clear()
  })

  it('can store and retrieve forms', async () => {
    const mockForm = {
      id: 'form-1',
      name: 'Test Form',
      fields: [],
      published: true,
      created_at: new Date().toISOString()
    }

    await db.saveForms([mockForm])
    const { forms } = await db.getForms()
    
    expect(forms).toHaveLength(1)
    expect(forms[0].name).toBe('Test Form')
  })

  it('can page cached entries by form', async () => {
    await db.saveEntries([
      { id: '1', form_id: 'form-1', data: {}, created_at: '2026-06-20T10:00:00Z', updated_at: '2026-06-20T10:00:00Z' },
      { id: '2', form_id: 'form-1', data: {}, created_at: '2026-06-21T10:00:00Z', updated_at: '2026-06-21T10:00:00Z' },
      { id: '3', form_id: 'form-2', data: {}, created_at: '2026-06-22T10:00:00Z', updated_at: '2026-06-22T10:00:00Z' }
    ])

    const page = await db.getCachedEntries({ formId: 'form-1', limit: 1, offset: 0 })

    expect(page.total).toBe(2)
    expect(page.entries).toHaveLength(1)
    expect(page.entries[0].id).toBe('2')
  })

  it('can store and retrieve pending entries', async () => {
    const mockEntry = {
      form_id: 'form-1',
      data: { field: 'value' },
      created_at: new Date().toISOString()
    }

    const id = await db.savePendingEntry(mockEntry)
    const pending = await db.getPendingEntries()
    
    expect(pending).toHaveLength(1)
    expect(pending[0].id).toBe(id)
    expect(pending[0].data.field).toBe('value')
  })

  it('can delete pending entries after sync', async () => {
    const id = await db.savePendingEntry({
      form_id: 'form-1',
      data: {},
      created_at: new Date().toISOString()
    })

    await db.removePendingEntry(id!)
    const pending = await db.getPendingEntries()
    expect(pending).toHaveLength(0)
  })
})
