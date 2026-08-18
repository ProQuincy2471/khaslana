/* Khaslana — service worker.

   Two rules, and everything else follows from them:

   1. Anything under /api/ is never cached. That's the sync endpoint —
      caching it would mean two devices could each believe they have the
      latest Coreflame streak while actually looking at a stale copy.
   2. Everything else (the shell, the codex chapters, the fonts) is
      cache-first with a network update running behind it, so the app
      opens instantly even on a bad connection, and quietly catches up
      the next time it can reach the network.

   Bump CACHE_NAME when the shell itself changes shape (new files added
   to CORE, a renamed asset) — old caches are swept on activate. */

const CACHE_NAME = 'khaslana-v1';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/app.css',
  './assets/app.js',
  './assets/canvas.js',
  './assets/emblem.js',
  './assets/extract.js',
  './assets/graph.js',
  './assets/fonts.css',
  './data/codex-index.js',
  './data/lore.js',
  './data/prompts.js',
  './data/sky.js',
  './data/voices.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  /* Sync traffic: network only, never cached, never intercepted. */
  if (url.pathname.startsWith('/api/')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE_NAME).then((cache) => cache.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      /* Cache-first for anything already saved — instant open — with the
         network fetch above still running to refresh it for next time. */
      return cached || network;
    })
  );
});
