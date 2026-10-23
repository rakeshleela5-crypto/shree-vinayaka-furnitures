// Self-destructing Service Worker for Shree Vinayaka Furnitures ERP
// Immediately purges all old caches and unregisters itself to prevent stale deployment chunk locks

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        for (const client of clients) {
          client.navigate(client.url);
        }
      })
  );
});

// Pass all fetch requests directly through to the live network
self.addEventListener('fetch', () => {
  // Do not intercept or cache
});
