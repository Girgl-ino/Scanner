// Offline-Speicher: nach dem ersten Öffnen läuft die App auch ohne Internet
const CACHE = 'blattscanner-v5';
const FILES = ['./', 'index.html', 'scan.js', 'pdf.js', 'ocr.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => {
    // Texterkennung (ca. 5 MB) beim ersten Gebrauch speichern, danach auch offline nutzbar
    if (resp.ok && u.pathname.includes('/ocr/')) { const cp = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); }
    return resp;
  })));
});
