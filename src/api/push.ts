import client from './client'

export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  content_encoding: 'aes128gcm'
}

export const pushApi = {
  config() {
    return client.get<{ public_key: string }>('/push/config')
  },

  subscribe(subscription: PushSubscriptionPayload) {
    return client.post<{ id: string }>('/push/subscriptions', subscription)
  },

  unsubscribe(endpoint: string) {
    return client.delete('/push/subscriptions', { endpoint })
  }
}
