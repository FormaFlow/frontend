self.addEventListener('push', event => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'FormaFlow', {
    body: payload.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: payload.tag || 'formaflow-notification',
    data: { url: payload.url || '/' }
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href

  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existingClient = clients.find(client => client.url === targetUrl)
    if (existingClient) {
      return existingClient.focus()
    }

    return self.clients.openWindow(targetUrl)
  }))
})
