// Service Worker for Push Notifications
// Creative AI Studio - Push Notification Service Worker

const CACHE_NAME = 'creative-ai-studio-v1'
const API_BASE = self.location.origin

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching notification assets...')
        return cache.addAll([
          '/icons/default.png',
          '/icons/badge.png',
          '/icons/check-circle.png',
          '/icons/error.png',
          '/icons/warning.png',
          '/icons/backup.png',
          '/icons/collaboration.png',
          '/icons/security.png',
          '/icons/chart.png'
        ]).catch(err => {
          console.log('Service Worker: Error caching assets:', err)
        })
      })
  )

  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )

  // Take control of all pages immediately
  self.clients.claim()
})

// Push event - handles incoming push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push event received')

  if (!event.data) {
    console.log('Service Worker: Push event has no data')
    return
  }

  try {
    const data = event.data.json()
    console.log('Service Worker: Push data:', data)

    const options = {
      body: data.body || 'Nova notificação disponível',
      icon: data.icon || '/icons/default.png',
      badge: data.badge || '/icons/badge.png',
      image: data.image,
      data: data.data || {},
      tag: data.tag || 'creative-ai-notification',
      requireInteraction: data.requireInteraction || false,
      vibrate: data.vibrate || [200, 100, 200],
      actions: data.actions || [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Dispensar',
          icon: '/icons/dismiss.png'
        }
      ],
      timestamp: Date.now(),
      silent: data.silent || false
    }

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title || 'Creative AI Studio', options)
        .then(() => {
          console.log('Service Worker: Notification displayed successfully')
          
          // Send delivery confirmation to server
          return fetch(`${API_BASE}/api/notifications/delivery`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              notification_id: data.data?.notification_id,
              status: 'delivered',
              timestamp: new Date().toISOString()
            })
          }).catch(err => {
            console.error('Service Worker: Failed to send delivery confirmation:', err)
          })
        })
        .catch(err => {
          console.error('Service Worker: Failed to show notification:', err)
        })
    )

  } catch (error) {
    console.error('Service Worker: Error processing push event:', error)
  }
})

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked:', event)

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  // Close the notification
  notification.close()

  if (action === 'dismiss') {
    console.log('Service Worker: Notification dismissed')
    return
  }

  // Handle notification click
  event.waitUntil(
    (async () => {
      try {
        // Send click tracking to server
        await fetch(`${API_BASE}/api/notifications/click`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notification_id: data.notification_id,
            action: action || 'click',
            timestamp: new Date().toISOString()
          })
        }).catch(err => {
          console.error('Service Worker: Failed to send click tracking:', err)
        })

        // Get the URL to open
        let urlToOpen = data.action_url || '/dashboard'
        
        // Ensure URL is absolute
        if (!urlToOpen.startsWith('http')) {
          urlToOpen = `${API_BASE}${urlToOpen}`
        }

        // Check if any window is already open
        const windowClients = await clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        })

        // Focus existing window or open new one
        let clientToFocus = null

        for (const client of windowClients) {
          if (client.url.includes('/dashboard')) {
            clientToFocus = client
            break
          }
        }

        if (clientToFocus) {
          // Focus existing window and navigate
          if ('navigate' in clientToFocus) {
            await clientToFocus.navigate(urlToOpen)
          }
          await clientToFocus.focus()
        } else {
          // Open new window
          await clients.openWindow(urlToOpen)
        }

        console.log('Service Worker: Opened URL:', urlToOpen)

      } catch (error) {
        console.error('Service Worker: Error handling notification click:', error)
      }
    })()
  )
})

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('Service Worker: Notification closed:', event)

  const data = event.notification.data || {}

  // Send close tracking to server
  event.waitUntil(
    fetch(`${API_BASE}/api/notifications/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notification_id: data.notification_id,
        timestamp: new Date().toISOString()
      })
    }).catch(err => {
      console.error('Service Worker: Failed to send close tracking:', err)
    })
  )
})

// Background sync for offline notifications
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync:', event.tag)
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      syncPendingNotifications()
    )
  }
})

// Message event - communication with main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received:', event.data)

  const { type, data } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_VERSION':
      event.ports[0].postMessage({
        type: 'VERSION',
        version: CACHE_NAME
      })
      break
      
    case 'CLEAR_NOTIFICATIONS':
      clearAllNotifications()
      break
      
    default:
      console.log('Service Worker: Unknown message type:', type)
  }
})

// Fetch event - handle network requests
self.addEventListener('fetch', event => {
  // Only handle GET requests for notification assets
  if (event.request.method === 'GET' && event.request.url.includes('/icons/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request)
        })
        .catch(err => {
          console.error('Service Worker: Fetch error:', err)
          return new Response('', { status: 404 })
        })
    )
  }
})

// Helper functions
async function syncPendingNotifications() {
  try {
    console.log('Service Worker: Syncing pending notifications...')
    
    // In a real implementation, this would sync with the server
    // to get any missed notifications while offline
    
    const response = await fetch(`${API_BASE}/api/notifications/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const { notifications } = await response.json()
      
      for (const notification of notifications) {
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon,
          badge: notification.badge,
          data: notification.data,
          tag: `sync-${notification.id}`
        })
      }
      
      console.log(`Service Worker: Synced ${notifications.length} notifications`)
    }
    
  } catch (error) {
    console.error('Service Worker: Error syncing notifications:', error)
  }
}

async function clearAllNotifications() {
  try {
    const notifications = await self.registration.getNotifications()
    
    for (const notification of notifications) {
      notification.close()
    }
    
    console.log(`Service Worker: Cleared ${notifications.length} notifications`)
  } catch (error) {
    console.error('Service Worker: Error clearing notifications:', error)
  }
}

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker: Global error:', event.error)
})

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection:', event.reason)
})

console.log('Service Worker: Script loaded successfully')