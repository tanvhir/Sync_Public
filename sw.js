// ===============================
// Service Worker: Cache + Push Notifications
// ===============================

const CACHE_NAME = 'sync-cache-v1';

const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32x32.png',
  './noti.png', // Added icon to cache so SW can load offline
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js'
];

// -------------------------------
// 1. OFFLINE CACHING
// -------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request).catch(() => {})
    )
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(names.map(name => {
        if (!cacheWhitelist.includes(name)) {
          return caches.delete(name);
        }
      }));
    })
  );
});

// -------------------------------
// 2. PUSH NOTIFICATIONS
// -------------------------------
self.addEventListener('push', event => {
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: '📢 Notification',
      body: event.data ? event.data.text() : '',
      icon: '/noti.png'
    };
  }

  const title = data.title || '📢 Notification';
  const body = data.body || '';
  
  // Always use your custom notification icon as default
  const icon = data.icon || '/noti.png';
  const badge = data.badge || '/noti.png';

  const options = {
    body: body,
    icon: icon,           // The big icon in expanded notification view
    badge: badge,         // The small status-bar icon
    image: data.image || undefined, // Optional big image/banner
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// -------------------------------
// 3. CLICK HANDLING
// -------------------------------
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
