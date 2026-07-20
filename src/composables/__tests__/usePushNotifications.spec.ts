import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pushApi } from '@/api/push'
import { usePushNotifications } from '@/composables/usePushNotifications'

vi.mock('@/api/push', () => ({
  pushApi: {
    config: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  }
}))

describe('usePushNotifications', () => {
  const subscription = {
    endpoint: 'https://push.example.test/device',
    toJSON: () => ({
      endpoint: 'https://push.example.test/device',
      keys: { p256dh: 'public-key', auth: 'auth-token' }
    }),
    unsubscribe: vi.fn().mockResolvedValue(true)
  }
  const pushManager = {
    getSubscription: vi.fn(),
    subscribe: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    pushManager.getSubscription.mockResolvedValue(null)
    pushManager.subscribe.mockResolvedValue(subscription)
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: Promise.resolve({ pushManager }) }
    })
    Object.defineProperty(window, 'PushManager', {
      configurable: true,
      value: class PushManager {}
    })
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') }
    })
    vi.mocked(pushApi.config).mockResolvedValue({ public_key: 'AQAB' })
  })

  it('subscribes this device and persists the browser subscription', async () => {
    const notifications = usePushNotifications()

    await notifications.enable()

    expect(pushManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }))
    expect(pushApi.subscribe).toHaveBeenCalledWith({
      endpoint: subscription.endpoint,
      keys: { p256dh: 'public-key', auth: 'auth-token' },
      content_encoding: 'aes128gcm'
    })
    expect(notifications.enabled.value).toBe(true)
  })

  it('removes the server subscription before unsubscribing the browser', async () => {
    pushManager.getSubscription.mockResolvedValue(subscription)
    const notifications = usePushNotifications()

    await notifications.disable()

    expect(pushApi.unsubscribe).toHaveBeenCalledWith(subscription.endpoint)
    expect(subscription.unsubscribe).toHaveBeenCalled()
    expect(notifications.enabled.value).toBe(false)
  })
})
