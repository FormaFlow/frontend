import {beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount} from '@vue/test-utils'
import {createI18n} from 'vue-i18n'
import {createPinia, setActivePinia} from 'pinia'
import {createMemoryHistory, createRouter} from 'vue-router'
import TheHeader from '@/components/layout/TheHeader.vue'
import {useWorkspaceStore} from '@/stores/workspace'
import ru from '@/locales/ru.json'

vi.mock('@/api/learning', () => ({
  workspaceApi: {list: vi.fn()}
}))

const workspace = (role: 'owner' | 'admin' | 'guardian' | 'learner' | 'member') => ({
  id: `workspace-${role}`,
  name: 'Семья',
  slug: 'family',
  role,
  timezone: 'Europe/Moscow',
  modules: {learning: true}
})

async function mountHeader(role: 'owner' | 'admin' | 'guardian' | 'learner' | 'member', path = '/') {
  const pinia = createPinia()
  setActivePinia(pinia)
  useWorkspaceStore().current = workspace(role)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {path: '/', component: {template: '<div />'}},
      {path: '/admin', component: {template: '<div />'}},
      {path: '/learn', component: {template: '<div />'}},
      {path: '/forms', component: {template: '<div />'}},
      {path: '/entries', component: {template: '<div />'}},
      {path: '/quizzes', component: {template: '<div />'}},
      {path: '/profile', component: {template: '<div />'}},
      {path: '/login', component: {template: '<div />'}}
    ]
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(TheHeader, {
    global: {
      plugins: [pinia, router, createI18n({legacy: false, locale: 'ru', messages: {ru}})]
    }
  })
  return wrapper
}

describe('TheHeader role-aware navigation', () => {
  beforeEach(() => localStorage.clear())

  it.each(['owner', 'admin'] as const)('shows FormaFlow and a separate Admin switch to %s', async role => {
    const wrapper = await mountHeader(role)

    expect(wrapper.get('[data-testid="header-brand"]').text()).toContain('FormaFlow')
    expect(wrapper.get('[data-testid="workspace-mode-switch"]').attributes('href')).toBe('/admin')
    expect(wrapper.get('[data-testid="workspace-mode-switch"]').text()).toBe('Админ')
    await wrapper.get('button[aria-controls="main-navigation"]').trigger('click')
    expect(wrapper.get('#main-navigation').text()).not.toContain('Админ')
    expect(wrapper.text()).not.toContain('Платежи')
  })

  it('uses admin branding in admin mode and returns cleanly to FormaFlow', async () => {
    const wrapper = await mountHeader('owner', '/admin')

    expect(wrapper.get('[data-testid="header-brand"]').text()).toContain('Forma Админ')
    expect(wrapper.get('[data-testid="workspace-mode-switch"]').text()).toBe('На сайт')
    await wrapper.get('[data-testid="workspace-mode-switch"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="header-brand"]').text()).toContain('FormaFlow')
  })

  it('uses school branding for a learner', async () => {
    const wrapper = await mountHeader('learner', '/learn')

    expect(wrapper.get('[data-testid="header-brand"]').text()).toContain('Forma Школа')
    expect(wrapper.find('[data-testid="workspace-mode-switch"]').exists()).toBe(false)
  })

  it('shows a read-only progress switch to a guardian', async () => {
    const wrapper = await mountHeader('guardian')

    expect(wrapper.get('[data-testid="workspace-mode-switch"]').text()).toBe('Прогресс')
    expect(wrapper.get('[data-testid="workspace-mode-switch"]').attributes('href')).toBe('/admin')
  })

  it.each(['member', 'learner'] as const)('does not expose Admin or Payments to %s', async role => {
    const wrapper = await mountHeader(role)

    await wrapper.get('button[aria-controls="main-navigation"]').trigger('click')
    expect(wrapper.text()).not.toContain('Админ')
    expect(wrapper.text()).not.toContain('Платежи')
  })
})
