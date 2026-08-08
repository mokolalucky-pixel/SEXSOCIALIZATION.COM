const CACHE_NAME = 'sexsoc-v3'
const PRECACHE_URLS = ['/', '/favicon.svg', '/logo.svg', '/icons.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET and API requests
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return
  }

  const isNavigation = request.mode === 'navigate'
  const fetchAndCache = () => fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
      }
      return response
    })

  event.respondWith(
    isNavigation
      ? fetchAndCache().catch(() => caches.match(request))
      : caches.match(request).then((cached) => cached || fetchAndCache()),
  )
})
