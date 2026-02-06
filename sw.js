
const CACHE_NAME = 'gemini-pos-v3';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com?plugins=typography'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Cache First for assets, Network First for API
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategy: Network first for API or specific data
  if (url.origin === self.location.origin && (url.pathname.startsWith('/api') || url.pathname.includes('gemini'))) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy: Cache first, then network for assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic' && fetchResponse.type !== 'cors') {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (url.protocol.startsWith('http')) {
            cache.put(event.request, responseToCache);
          }
        });

        return fetchResponse;
      });
    })
  );
});
