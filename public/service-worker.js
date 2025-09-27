
// Service Worker for Omegle-style Video Chat PWA
const CACHE_NAME = 'omegle-chat-v1.0.0';
const STATIC_CACHE = 'omegle-static-v1.0.0';

// Essential assets to cache
const CACHE_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/logo.png',
    '/logo.jpg',
    '/favicon.ico',
    // Font Awesome for icons
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching essential assets');
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        // Delete old caches that don't match current version
                        if (cache !== STATIC_CACHE && cache !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation complete');
                // Claim control of all clients
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('Service Worker: Activation failed', error);
            })
    );
});

// Fetch event - implement cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip cross-origin requests and non-GET requests
    if (url.origin !== location.origin || request.method !== 'GET') {
        return;
    }
    
    // Skip WebSocket connections and API calls
    if (url.protocol === 'ws:' || url.protocol === 'wss:' || 
        url.pathname.includes('/api/') || 
        url.pathname.includes('/socket.io/')) {
        return;
    }
    
    event.respondWith(
        cacheFirst(request)
    );
});

// Cache-first strategy with network fallback
async function cacheFirst(request) {
    try {
        // Try to get response from cache first
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('Service Worker: Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // If not in cache, fetch from network
        console.log('Service Worker: Fetching from network:', request.url);
        const networkResponse = await fetch(request);
        
        // Cache successful responses for static assets
        if (networkResponse.ok && isStaticAsset(request.url)) {
            const cache = await caches.open(STATIC_CACHE);
            console.log('Service Worker: Caching new asset:', request.url);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('Service Worker: Fetch failed for:', request.url, error);
        
        // Return offline fallback for HTML pages
        if (request.destination === 'document') {
            const fallbackResponse = await caches.match('/index.html');
            if (fallbackResponse) {
                console.log('Service Worker: Serving offline fallback');
                return fallbackResponse;
            }
        }
        
        // Return a basic error response
        return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

// Helper function to determine if URL is a static asset
function isStaticAsset(url) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    const urlPath = new URL(url).pathname.toLowerCase();
    
    return staticExtensions.some(ext => urlPath.endsWith(ext)) || 
           url.includes('cdnjs.cloudflare.com') ||
           urlPath === '/' || 
           urlPath.endsWith('.html');
}

// Handle service worker updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('Service Worker: Received skip waiting message');
        self.skipWaiting();
    }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Handle background sync tasks here
            Promise.resolve()
        );
    }
});

// Push notification handler (future enhancement)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New message received',
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'omegle-notification',
            requireInteraction: false,
            actions: [
                {
                    action: 'view',
                    title: 'View Chat'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'Omegle Chat', options)
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('Service Worker: Script loaded successfully');
