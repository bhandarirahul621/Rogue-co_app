/* Rogue&Co service worker: caches the storefront so it opens offline and installs as an app.
   Bump CACHE whenever you change files in this folder so visitors get the new version. */
const CACHE = 'rogueco-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/css/styles.css',
  '/js/main.js',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/images/hero.jpg',
  '/images/tees.jpg',
  '/images/rack.jpg',
  '/images/jeans.jpg',
  '/images/linen.jpg',
  '/images/folded.jpg',
  '/images/shirts.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Pages: try the network first so updates show up, fall back to the cached copy offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('/index.html', copy)); return res; })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Everything else (CSS, JS, images, Google Fonts): serve from cache, fetch and store on a miss.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
