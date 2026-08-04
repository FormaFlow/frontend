import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import QuickEntryWidget from '../QuickEntryWidget.vue'
import EntryStatsSummary from '@/components/entries/EntryStatsSummary.vue'
import FormSwitcher from '@/components/entries/FormSwitcher.vue'
import { entriesApi } from '@/api/entries'
import { formsApi } from '@/api/forms'
import { db } from '@/db'
import ru from '@/locales/ru.json'
import type { Form } from '@/types/form'

vi.mock('@/api/forms', () => ({
  formsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}))

vi.mock('@/api/entries', () => ({
  entriesApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    weeklyStats: vi.fn(),
  }
}))

const mockOnLine = vi.spyOn(navigator, 'onLine', 'get')

const forms: Form[] = [
  {
    id: 'form-1',
    name: 'Daily form',
    description: '',
    fields: [
      { id: 'value', name: 'value', label: 'Value', type: 'text', required: true }
    ],
    published: true,
    quick_entry_favorite: false,
    created_at: '2026-07-07T00:00:00.000Z',
    updated_at: '2026-07-07T00:00:00.000Z',
  } as Form,
  {
    id: 'form-2',
    name: 'Other form',
    description: '',
    fields: [
      { id: 'value', name: 'value', label: 'Value', type: 'text', required: true }
    ],
    published: true,
    quick_entry_favorite: false,
    created_at: '2026-07-07T00:00:00.000Z',
    updated_at: '2026-07-07T00:00:00.000Z',
  } as Form
]

function mountWidget() {
  const i18n = createI18n({
    legacy: false,
    locale: 'ru',
    fallbackLocale: 'ru',
    messages: { ru }
  })

  return mount(QuickEntryWidget, {
    global: {
      plugins: [createPinia(), i18n],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a><slot /></a>'
        },
        AppSelect: {
          props: ['modelValue', 'options', 'placeholder'],
          emits: ['update:modelValue'],
          template: `
            <select
              :value="modelValue"
              :aria-label="placeholder"
              @change="$emit('update:modelValue', $event.target.value)"
            >
              <option value="">{{ placeholder }}</option>
              <option v-for="option in options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          `
        },
        AppLoader: true
      }
    }
  })
}

describe('QuickEntryWidget cache refresh', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    await db.forms.clear()
    await db.entries.clear()
    await db.pendingEntries.clear()
    mockOnLine.mockReturnValue(true)

    vi.mocked(formsApi.list).mockResolvedValue({
      forms,
      total: forms.length,
      limit: 10,
      offset: 0
    })
    vi.mocked(formsApi.get).mockImplementation(async id => forms.find(form => form.id === id) || forms[0])
    vi.mocked(entriesApi.weeklyStats).mockResolvedValue({
      days: [],
      months: {}
    })
    vi.mocked(entriesApi.list).mockResolvedValue({entries: [], total: 0, limit: 5, offset: 0})
  })

  it('refetches a selected form even when its local quick-entry list is already empty', async () => {
    let formOneCalls = 0
    let serverHasEntry = false

    vi.mocked(entriesApi.list).mockImplementation(async params => {
      if (params?.form_id === 'form-1') {
        formOneCalls += 1

        if (!serverHasEntry) {
          return { entries: [], total: 0, limit: 5, offset: 0 }
        }

        return {
          entries: [
            {
              id: 'fresh-entry',
              form_id: 'form-1',
              data: { value: 'fresh from server' },
              created_at: '2026-07-07T09:00:00.000Z',
              updated_at: '2026-07-07T09:00:00.000Z'
            }
          ],
          total: 1,
          limit: 5,
          offset: 0
        }
      }

      return { entries: [], total: 0, limit: 5, offset: 0 }
    })

    const wrapper = mountWidget()
    await flushPromises()

    await selectForm(wrapper, 'form-1')
    await flushPromises()

    expect(wrapper.text()).toContain('Записи не найдены')
    const callsBeforeRemoteUpdate = formOneCalls
    serverHasEntry = true

    await selectForm(wrapper, 'form-2')
    await flushPromises()
    await selectForm(wrapper, 'form-1')
    await flushPromises()

    expect(formOneCalls).toBeGreaterThan(callsBeforeRemoteUpdate)
    expect(wrapper.text()).toContain('fresh from server')
  })

  it('lists only published favorite forms when favorites exist', async () => {
    vi.mocked(formsApi.list).mockResolvedValue({
      forms: [
        { ...forms[0], quick_entry_favorite: true },
        { ...forms[1], quick_entry_favorite: false },
        { ...forms[1], id: 'form-3', name: 'Draft favorite', published: false, quick_entry_favorite: true },
      ],
      total: 3,
      limit: 10,
      offset: 0
    })

    const wrapper = mountWidget()
    await flushPromises()

    const vm = wrapper.vm as unknown as { formOptions: Array<{ label: string; value: string }> }
    expect(vm.formOptions).toEqual([
      { label: 'Daily form', value: 'form-1' }
    ])
  })

  it('opens the first available form immediately', async () => {
    const wrapper = mountWidget()
    await flushPromises()

    const vm = wrapper.vm as unknown as {selectedFormId: string}
    expect(vm.selectedFormId).toBe('form-1')
  })

  it('shows the neighboring form names on navigation buttons', async () => {
    const wrapper = mountWidget()
    await flushPromises()

    await selectForm(wrapper, 'form-1')
    await flushPromises()

    const switcher = wrapper.findComponent(FormSwitcher)
    const neighborNames = switcher.findAll('.form-neighbor-name')
    expect(neighborNames.map(item => item.text())).toEqual(['Other form', 'Other form'])

    await switcher.findAll('button')[1].trigger('click')
    await flushPromises()

    const vm = wrapper.vm as unknown as {selectedFormId: string}
    expect(vm.selectedFormId).toBe('form-2')
    expect(neighborNames.map(item => item.text())).toEqual(['Daily form', 'Daily form'])
  })

  it('toggles statistics above the form and remembers the state', async () => {
    const wrapper = mountWidget()
    await flushPromises()
    await selectForm(wrapper, 'form-1')
    await flushPromises()

    const statsButton = wrapper.findAll('button').find(button => button.text() === 'Статистика')
    expect(statsButton).toBeDefined()
    const summary = wrapper.findComponent(EntryStatsSummary)
    const statsPanel = wrapper.get('[data-testid="quick-entry-stats"]')
    expect(summary.exists()).toBe(true)
    expect(statsPanel.attributes('style')).toContain('display: none')
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)

    await statsButton!.trigger('click')
    await flushPromises()

    expect(statsPanel.attributes('style') ?? '').not.toContain('display: none')
    expect(summary.props('formId')).toBe('form-1')
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(localStorage.getItem('formaflow:quick-stats-visible')).toBe('true')

    const restoredWrapper = mountWidget()
    await flushPromises()
    expect(restoredWrapper.get('[data-testid="quick-entry-stats"]').attributes('style') ?? '')
      .not.toContain('display: none')
    restoredWrapper.unmount()

    const dateInput = summary.find('input[type="date"]')
    expect(dateInput.exists()).toBe(true)
    await dateInput.setValue('2026-07-01')
    await flushPromises()
    expect(entriesApi.weeklyStats).toHaveBeenCalledWith('form-1', '2026-07-01')

    await statsButton!.trigger('click')
    expect(statsPanel.attributes('style')).toContain('display: none')
    expect(localStorage.getItem('formaflow:quick-stats-visible')).toBe('false')
  })
})

async function selectForm(wrapper: ReturnType<typeof mount>, formId: string): Promise<void> {
  const vm = wrapper.vm as unknown as {
    selectedFormId: string
    handleFormSelect: (formId: string) => Promise<void>
  }

  vm.selectedFormId = formId
  await vm.handleFormSelect(formId)
}
