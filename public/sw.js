/* eslint-disable no-restricted-globals */

// This is the service worker with the Cache-first network

const CACHE_NAME = 'cde-event-prep-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/vite.svg',
  '/manifest.json',
  // Add other assets you want to cache
];

const CACHE_WHITELIST = [CACHE_NAME];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Activate the service worker immediately
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests, like those for Google Analytics
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // For navigation requests, serve the offline page if fetch fails
        if (event.request.mode === 'navigate') {
          return fetch(event.request)
            .catch(() => caches.match('/offline.html'));
        }
        
        // For all other requests, try the network first, then cache
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If fetch fails and it's a request for an HTML page, return the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        }).filter(cacheName => cacheName !== null)
      );
    })
  );
  // Take control of all pages under this service worker's scope
  self.clients.claim();
});

// Listen for the "message" event to handle updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
