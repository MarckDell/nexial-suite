// Nexial Suite - Service Worker
const CACHE_NAME = 'nexial-v3.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/pwa-manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', event => {
  // No cachear requests a Google Apps Script
  if (event.request.url.includes('script.google.com')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.url.includes('.html')) {
          return caches.match('/index.html');
        }
        return new Response('Modo offline - Nexial Suite', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Actualizar Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manejar notificaciones push
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Nexial Suite',
    icon: 'https://cdn-icons-png.flaticon.com/512/3279/3279900.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3279/3279900.png',
    vibrate: [200, 100, 200],
    tag: 'nexial-notification',
    data: {
      url: '/dashboard.html'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Nexial Suite', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/dashboard.html');
      }
    })
  );
});