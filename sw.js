// Pieware 2 Service Worker — offline-first untuk app shell
const CACHE_NAME = 'pieware2-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icons/icon.svg',
    './icons/icon-maskable.svg'
];

// Install: cache semua app shell
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

// Activate: buang cache lama
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: app shell = cache-first; Firebase/API = network-only (biar pass-through)
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    // Jangan cache permintaan lintas asal (Firebase, CDN, font) — biarkan ke network
    if (url.origin !== location.origin) return;
    e.respondWith(
        caches.match(e.request).then(cached =>
            cached ||
            fetch(e.request).then(resp => {
                // Cache-as-you-go untuk request same-origin yang berjaya
                if (resp && resp.status === 200) {
                    const clone = resp.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return resp;
            }).catch(() => {
                // Fallback offline: index.html untuk navigasi
                if (e.request.mode === 'navigate') return caches.match('./index.html');
            })
        )
    );
});
