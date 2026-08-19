import {beforeEach, describe, expect, it, vi} from 'vitest'
import {mount} from '@vue/test-utils'
import {createI18n} from 'vue-i18n'
import {createPinia, setActivePinia} from 'pinia'
import {createMemoryHistory, createRouter} from 'vue-router'
import TheHeader from '@/components/layout/TheHeader.vue'
import {useWorkspaceStore} from '@/stores/workspace'
import ru from '@/locales/ru.json'

vi.mock('@/api/learning', () => ({
  workspaceApi: {list: vi.fn()}
}))

const workspace = (role: 'owner' | 'admin' | 'learner' | 'member') => ({
  id: `workspace-${role}`,
  name: 'Семья',
  slug: 'family',
  role,
  timezone: 'Europe/Moscow',
  modules: {learning: true}
})

async function mountHeader(role: 'owner' | 'admin' | 'learner' | 'member') {
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
  await router.push('/')
  await router.isReady()

  const wrapper = mount(TheHeader, {
    global: {
      plugins: [pinia, router, createI18n({legacy: false, locale: 'ru', messages: {ru}})]
    }
  })
  await wrapper.get('button[aria-controls="main-navigation"]').trigger('click')
  return wrapper
}

describe('TheHeader role-aware navigation', () => {
  beforeEach(() => localStorage.clear())

  it.each(['owner', 'admin'] as const)('keeps the regular dashboard available to %s and shows Admin', async role => {
    const wrapper = await mountHeader(role)

    expect(wrapper.get('header a').attributes('href')).toBe('/')
    expect(wrapper.text()).toContain('Админ')
    expect(wrapper.text()).not.toContain('Платежи')
  })

  it.each(['member', 'learner'] as const)('does not expose Admin or Payments to %s', async role => {
    const wrapper = await mountHeader(role)

    expect(wrapper.get('header a').attributes('href')).toBe('/')
    expect(wrapper.text()).not.toContain('Админ')
    expect(wrapper.text()).not.toContain('Платежи')
  })
})
