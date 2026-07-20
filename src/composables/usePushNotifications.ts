import { computed, ref } from 'vue'
import { pushApi } from '@/api/push'

const enabled = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

function decodeVapidPublicKey(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const decoded = atob(base64)

  const bytes = new Uint8Array(new ArrayBuffer(decoded.length))
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }

  return bytes.buffer
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready
}

export function usePushNotifications() {
  const supported = computed(() =>
    typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
  )

  const refresh = async () => {
    if (!supported.value) {
      enabled.value = false
      return
    }

    const registration = await getRegistration()
    enabled.value = await registration.pushManager.getSubscription() !== null
  }

  const enable = async () => {
    if (!supported.value) {
      throw new Error('Push notifications are not supported by this browser.')
    }

    loading.value = true
    error.value = null
    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.')
      }

      const registration = await getRegistration()
      const current = await registration.pushManager.getSubscription()
      const subscription = current ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidPublicKey((await pushApi.config()).public_key)
      })
      const serialized = subscription.toJSON()
      if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys?.auth) {
        throw new Error('The browser returned an incomplete push subscription.')
      }

      await pushApi.subscribe({
        endpoint: serialized.endpoint,
        keys: {
          p256dh: serialized.keys.p256dh,
          auth: serialized.keys.auth
        },
        content_encoding: 'aes128gcm'
      })
      enabled.value = true
    } catch (exception) {
      error.value = exception instanceof Error ? exception.message : String(exception)
      throw exception
    } finally {
      loading.value = false
    }
  }

  const disable = async () => {
    if (!supported.value) return

    loading.value = true
    error.value = null
    try {
      const registration = await getRegistration()
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await pushApi.unsubscribe(subscription.endpoint)
        await subscription.unsubscribe()
      }
      enabled.value = false
    } catch (exception) {
      error.value = exception instanceof Error ? exception.message : String(exception)
      throw exception
    } finally {
      loading.value = false
    }
  }

  return { supported, enabled, loading, error, refresh, enable, disable }
}
