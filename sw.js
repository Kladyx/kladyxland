// KLADYXLAND Service Worker – Web Push v1.0
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '🎧 KLADYXLAND';
  const options = {
    body: data.body || 'Právě vysílám živě!',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: 'kladyx-onair',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || 'https://kladyxland.netlify.app' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data && e.notification.data.url
    ? e.notification.data.url
    : 'https://kladyxland.netlify.app';
  e.waitUntil(clients.openWindow(url));
});
