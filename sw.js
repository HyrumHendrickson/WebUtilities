/* Offline support: precache the app shell, cache everything else as it is used. */

const VERSION = 'v1';
const CACHE = `web-utilities-${VERSION}`;
const SHELL = [
  './',
  'index.html',
  'css/tokens.css',
  'css/base.css',
  'css/components.css',
  'js/theme-init.js',
  'js/main.js',
  'js/ui.js',
  'js/icons.js',
  'js/registry.js',
  'assets/icons/icon-64.png',
  'assets/icons/icon-512.png',
  'assets/fonts/nunito-latin-wght-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith('web-utilities-') && key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Stale-while-revalidate: answer from cache immediately and refresh in the background.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
