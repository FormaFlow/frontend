import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../index'

describe('Database Service', () => {
  beforeEach(async () => {
    await db.forms.clear()
    await db.pendingEntries.clear()
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
    const forms = await db.getForms()
    
    expect(forms).toHaveLength(1)
    expect(forms[0].name).toBe('Test Form')
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
