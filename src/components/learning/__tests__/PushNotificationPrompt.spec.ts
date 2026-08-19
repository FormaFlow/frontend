import {beforeEach, describe, expect, it, vi} from 'vitest'
import {mount} from '@vue/test-utils'
import {ref} from 'vue'
import PushNotificationPrompt from '@/components/learning/PushNotificationPrompt.vue'

const supported = ref(true)
const enabled = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const refresh = vi.fn()
const enable = vi.fn(async () => { enabled.value = true })

vi.mock('@/composables/usePushNotifications', () => ({
  usePushNotifications: () => ({supported, enabled, loading, error, refresh, enable})
}))

describe('PushNotificationPrompt', () => {
  beforeEach(() => {
    supported.value = true
    enabled.value = false
    loading.value = false
    error.value = null
    vi.clearAllMocks()
  })

  it('requires an explicit learner click before enabling notifications', async () => {
    const wrapper = mount(PushNotificationPrompt, {props: {audience: 'learner'}})

    expect(wrapper.text()).toContain('Не пропускайте новые задания')
    expect(enable).not.toHaveBeenCalled()
    await wrapper.get('button').trigger('click')
    expect(enable).toHaveBeenCalledOnce()
    expect(wrapper.find('[data-testid="push-notification-prompt"]').exists()).toBe(false)
  })

  it('does not distract a device that already has push enabled', () => {
    enabled.value = true
    const wrapper = mount(PushNotificationPrompt, {props: {audience: 'guardian'}})

    expect(wrapper.find('[data-testid="push-notification-prompt"]').exists()).toBe(false)
  })
})
