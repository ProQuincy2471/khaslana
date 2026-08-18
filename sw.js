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

const CACHE_NAME = 'khaslana-2026.08.19-a';
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
  /* La cáscara de UltraXFiles. Los assets con hash NO se listan: entran solos
     la primera vez que se abre la pestaña y ahí se quedan. Listarlos aquí
     obligaría a reescribir este archivo en cada compilación. */
  './ultraxfiles/index.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      /* addAll es todo-o-nada: si UltraXFiles todavía no está desplegado, la
         instalación entera fallaría y la app se quedaría sin service worker.
         Uno por uno, y lo que falte se recoge en el primer fetch. */
      Promise.all(CORE.map((u) => cache.add(u).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* UltraXFiles vive bajo ./ultraxfiles/ y se comporta distinto al resto:

   · Sus assets llevan hash en el nombre (a/index.<hash>.js). Un nombre nuevo
     es un archivo nuevo, así que cache-first es seguro y perpetuo.
   · Su index.html NO lleva hash — es el que decide qué hashes cargar. Si se
     sirve desde caché, la PWA se queda clavada en la versión vieja para
     siempre aunque el resto se haya actualizado. Va network-first, con la
     copia guardada sólo como red de seguridad cuando no hay conexión.

   Ese par —documento fresco, assets inmutables— es lo que hace que "la
   versión más reciente" sea cierto sin desactivar el modo sin conexión. */
const esDocumentoUXF = (url) =>
  url.pathname.includes('/ultraxfiles/') &&
  (url.pathname.endsWith('/ultraxfiles/') || url.pathname.endsWith('index.html'));

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  /* Sync traffic: network only, never cached, never intercepted. */
  if (url.pathname.startsWith('/api/')) return;

  if (esDocumentoUXF(url)) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copia));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match('./ultraxfiles/index.html')))
    );
    return;
  }

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
