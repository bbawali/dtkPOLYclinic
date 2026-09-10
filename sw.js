// Duttapukur Polyclinic — service worker
// Caches the app shell for offline loading and fast repeat visits.
// Firebase (Firestore/Auth) network calls are always passed straight
// through to the network — booking and data operations must always
// hit the live server, never a cached response.

const CACHE = 'dp-clinic-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;
  // Never cache/intercept Firebase traffic — always go live.
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('identitytoolkit') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('googleapis.com') ||
    url.includes('firebaseapp.com') ||
    url.includes('gstatic.com')
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
