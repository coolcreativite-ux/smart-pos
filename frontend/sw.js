
// Version du cache - INCRÉMENTER À CHAQUE DÉPLOIEMENT
const CACHE_VERSION = 'v5';
const CACHE_NAME = `smart-pos-${CACHE_VERSION}`;
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com?plugins=typography'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installation de la nouvelle version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache ouvert:', CACHE_NAME);
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  // Force l'activation immédiate du nouveau service worker
  self.skipWaiting();
});

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation de la nouvelle version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prendre le contrôle de tous les clients immédiatement
  self.clients.claim();
  
  // Notifier tous les clients qu'une nouvelle version est disponible
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NEW_VERSION',
        version: CACHE_VERSION
      });
    });
  });
});

// Fetch event - Network First pour tout (pour toujours avoir la dernière version)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ne jamais cacher index.html, sw.js, manifest.json
  if (url.pathname === '/' || 
      url.pathname === '/index.html' || 
      url.pathname === '/sw.js' || 
      url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy: Network First pour les API
  if (url.pathname.startsWith('/api') || url.pathname.includes('gemini')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy: Network First pour les assets aussi (pour avoir les nouveaux hashes)
  event.respondWith(
    fetch(event.request)
      .then((fetchResponse) => {
        // Si la réponse est OK, la mettre en cache
        if (fetchResponse && fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (url.protocol.startsWith('http')) {
              cache.put(event.request, responseToCache);
            }
          });
        }
        return fetchResponse;
      })
      .catch(() => {
        // En cas d'erreur réseau, utiliser le cache
        return caches.match(event.request);
      })
  );
});

// Message event - Gérer les messages des clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting demandé');
    self.skipWaiting();
  }
});
