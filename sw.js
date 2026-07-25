const CACHE = 'blepharitis-tracker-v2';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  const isPage = event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isPage) {
    // Сторінка: завжди пробуємо мережу першою, кеш — лише як запасний варіант офлайн
    event.respondWith(
      fetch(event.request)
        .then((res) => { caches.open(CACHE).then((c) => c.put(event.request, res.clone())); return res; })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Статичні файли: кеш спершу, як і раніше
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
