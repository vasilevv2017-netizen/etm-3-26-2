const CACHE_NAME = 'etm-v3.1.1.26-offline-v4';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Кэшируем основные файлы
      return cache.addAll(PRECACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Пропускаем chrome-extension и прочие схемы
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      // Если файл есть в кэше - отдаем его (Cache First)
      if (cached) return cached;

      // Если нет - идем в сеть и сохраняем результат
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic' && !event.request.url.includes('tailwindcss')) {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Если сети нет совсем и файла нет в кэше - возвращаем index.html (для SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});