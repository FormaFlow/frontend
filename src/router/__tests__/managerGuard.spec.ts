import {beforeEach, describe, expect, it} from 'vitest'
import {createPinia, setActivePinia} from 'pinia'
import router from '@/router'
import {useAuthStore} from '@/stores/auth'
import {useWorkspaceStore} from '@/stores/workspace'

describe('manager route guard', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.token = 'token'
    authStore.user = {id: 'user-1', name: 'User', email: 'user@example.test'}
    await router.replace('/')
  })

  it('redirects a regular workspace member away from admin routes', async () => {
    useWorkspaceStore().current = {
      id: 'workspace-1',
      name: 'Семья',
      slug: 'family',
      role: 'member',
      timezone: 'Europe/Moscow',
      modules: {learning: true}
    }

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('allows workspace owners into admin routes', async () => {
    useWorkspaceStore().current = {
      id: 'workspace-1',
      name: 'Семья',
      slug: 'family',
      role: 'owner',
      timezone: 'Europe/Moscow',
      modules: {learning: true}
    }

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('learning-admin')
  })
})
