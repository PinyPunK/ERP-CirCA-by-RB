const CACHE_NAME = 'circa-erp-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Instalación: guarda los archivos base de la interfaz
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activación: limpia cachés antiguas si actualizas la versión
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia de red: NUNCA cachear api.github.com (datos en tiempo real)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Regla de oro: las peticiones a la API de GitHub van siempre directo a internet
  if (url.hostname.includes('api.github.com') || url.hostname.includes('raw.githubusercontent.com')) {
    return;
  }

  // Solo gestionamos peticiones GET para la interfaz
  if (event.request.method !== 'GET') {
    return;
  }

  // Estrategia Network-First con respaldo en Caché (si no hay internet, abre la app igual)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});