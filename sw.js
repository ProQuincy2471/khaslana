/* Khaslana — service worker.

   Three rules, and everything else follows from them:

   1. Anything under /api/ is never cached. That's the sync endpoint —
      caching it would mean two devices could each believe they have the
      latest Coreflame streak while actually looking at a stale copy.
   2. The app shell itself — index.html, assets/*, data/*.js — is
      network-first. This app is under active, frequent development, and
      cache-first here means a real, correctness-affecting fix (like the
      accented-chapter one — see chapterURL() in app.js) reads as "still
      broken" on any device that opened the app since, right up until an
      unrelated second reload happens to catch it. Network-first means
      whatever's live is what loads, with the cached copy only as a
      fallback when there's no connection.
   3. Everything else (codex chapters, fonts) is cache-first with a
      network update running behind it — instant open, quietly catching
      up. Those don't change once written, so staleness there was never
      the problem network-first solves for the shell.

   Bump CACHE_NAME when the shell itself changes shape (new files added
   to CORE, a renamed asset) — old caches are swept on activate. */

const CACHE_NAME = 'khaslana-2026.08.20-b';
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
  /* La guía de Wellbeing: un solo archivo autocontenido, sin assets propios
     que listar — cache-first como los capítulos del Atlas, no network-first
     como la cáscara: es contenido que Jordan trae ya terminado, no código
     que este proyecto siga cambiando semana a semana. */
  './wellbeing/index.html',
];

/* Descarga y guarda un archivo del CORE — pero nunca a ciegas. Detrás de
   Cloudflare Access, una petición sin la cookie de sesión todavía vigente
   no da 404, da 200 con la página de login de Access en el cuerpo (tras
   seguir la redirección sola, por dentro de fetch). `cache.add()` no
   distingue eso de la respuesta real: la guardaría como si fuera
   `data/codex-index.js`, y cache-first serviría esa página de login como
   "el archivo" para siempre, sin importar cuántas veces se inicie sesión
   después — nada vuelve a pedirla por red mientras haya algo en caché.
   `res.redirected` es justo la señal de que eso pasó: se descarta esa
   respuesta en vez de guardarla, y el archivo se queda sin cachear hasta
   una visita donde sí llegue el real. */
async function guardarSiEsReal(cache, url) {
  try {
    const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok || res.redirected) return;
    await cache.put(url, res);
  } catch { /* sin red en la instalación: este archivo se recoge después */ }
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      /* Todo-o-nada rompería la instalación entera si un solo archivo (p.ej.
         UltraXFiles, si aún no está desplegado) fallara. Uno por uno, y lo
         que falte se recoge en el primer fetch normal. */
      Promise.all(CORE.map((u) => guardarSiEsReal(cache, u)))
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

/* `res.redirected` catches Access serving its own login page. It does NOT
   catch the other way a wrong URL comes back disguised as a real file:
   Cloudflare Pages answers a path that doesn't exist with Khaslana's own
   index.html — a genuine 200, never redirected — which is exactly what
   an un-normalized accented chapter URL used to hit before chapterURL()
   started fixing it at request time. That shell response is small enough
   that it looked, briefly, indistinguishable from "worked" to the code
   above: right status, no redirect. Once a copy of it got cached under a
   chapter's own URL, cache-first would hand back "the chapter" forever,
   correct server or not — the one way a fixed bug can still look broken
   on a device that cached the wrong answer once, at exactly the wrong
   moment (a flaky connection, a deploy still propagating). Reading the
   body for this one fingerprint before caching anything HTML-shaped
   closes that permanently: nothing that looks like Khaslana itself gets
   saved as if it were a chapter, no matter how it got served. */
async function esCascaraDisfrazada(res) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return false;
  try {
    const texto = await res.clone().text();
    /* Dos señales, no una: el título solo no bastó en la práctica — un
       redirect de Access que aterriza de vuelta en la cáscara puede
       dejarla con algo pegado al título (una query, lo que sea) que ya
       no es el string exacto "KHASLANA". id="nav" es la barra de salas
       propia de Khaslana — ningún capítulo real trae ese id — así que
       reconoce la cáscara por lo que de verdad es, no por una frase que
       el ruido de una redirección puede alterar. */
    return texto.includes('KHASLANA') && texto.includes('id="nav"');
  } catch { return false; }
}

/* The shell: the same files listed in CORE, minus UltraXFiles' own
   index.html (that one's matched by esDocumentoUXF above and handled the
   same way, network-first, but it needs its own fallback-to-itself logic
   so it isn't folded in here). Anything in this set is code or data that
   changes with a normal deploy — codex chapters and fonts aren't, and
   stay cache-first below. */
const APP_SHELL = new Set([
  '/', '/index.html', '/manifest.json',
  '/assets/app.css', '/assets/app.js', '/assets/canvas.js', '/assets/emblem.js',
  '/assets/extract.js', '/assets/graph.js', '/assets/fonts.css',
  '/data/codex-index.js', '/data/lore.js', '/data/prompts.js', '/data/sky.js', '/data/voices.js',
]);

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  /* Sync traffic: network only, never cached, never intercepted. */
  if (url.pathname.startsWith('/api/')) return;

  if (esDocumentoUXF(url) || APP_SHELL.has(url.pathname)) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          /* redirected === Access (u otra puerta) devolvió su propio login en
             vez del documento — no lo guardes como si fuera el archivo real. */
          if (res.ok && !res.redirected) {
            const copia = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copia));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((c) => c || (esDocumentoUXF(url) ? caches.match('./ultraxfiles/index.html') : undefined)))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then(async (res) => {
        /* Misma protección de redirección aquí, más la de la cáscara
           disfrazada — esta rama es la que sirve los capítulos del Atlas
           y la guía de Wellbeing, justo los archivos que un 200 con el
           shell adentro podría envenenar bajo su propio nombre. */
        if (res.ok && !res.redirected && !(await esCascaraDisfrazada(res))) {
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      /* Cache-first for anything already saved — instant open — with the
         network fetch above still running to refresh it for next time. */
      return cached || network;
    })
  );
});
