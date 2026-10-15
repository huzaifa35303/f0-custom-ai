// Caches the interface so the app opens instantly and still opens offline.
//
// Only the shell is cached. Answers are never cached: /api/chat depends on the
// brain and on live search, and a stale answer served from disk would be worse
// than no answer at all.

const VERSION = 'foundr-ai-v1';
const SHELL = [
  '/',
  '/style.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Anything live goes straight to the network, every time.
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (url.origin !== self.location.origin) return;

  // Network first, so a deployed change is picked up as soon as it is there,
  // falling back to the cached shell when there is no connection.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
  );
});
