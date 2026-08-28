const VERSION = 'exit-map-v1.0.1';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const GENERATED_ASSETS = [/* INJECT_ASSETS */];
const PRECACHE = [...new Set([
  '/', '/demo/', '/privacy/', '/terms/', '/404.html', '/offline.html', '/manifest.webmanifest',
  '/icon.svg', '/icon-192.png', '/icon-512.png', '/maskable-512.png',
  '/assets/hero-dossier.webp', ...GENERATED_ASSETS
])];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })) )));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== SHELL && key !== RUNTIME).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function navigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match('/')) || caches.match('/offline.html');
  }
}

async function asset(request) {
  // Module requests add an Origin header while install-time precache requests do not.
  // Ignore Vary so the same-origin cached response remains usable offline.
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(navigation(event.request));
    return;
  }
  event.respondWith(asset(event.request));
});
