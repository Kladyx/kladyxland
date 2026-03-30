// Service Worker pro KLADYXLAND - okamžitá aktualizace
const CACHE_VERSION = 'v1.0';

// Nepřipojovat žádnou cache - vždy načíst z internetu
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request, {
      cache: 'no-cache'
    }).catch(() => {
      // Pokud je offline, zkus cache
      return caches.match(event.request);
    })
  );
});

// Při instalaci přeskoč waiting a aktivuj se okamžitě
self.addEventListener('install', event => {
  console.log('Service Worker instalován');
  self.skipWaiting();
});

// Při aktivaci převezmi kontrolu okamžitě
self.addEventListener('activate', event => {
  console.log('Service Worker aktivován');
  event.waitUntil(
    clients.claim()
  );
});
