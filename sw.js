// Mythbreed Derby offline support. The page opens from the cache straight away (and works with no signal);
// a fresh copy is fetched in the background and used the next time the app opens.
const CACHE = 'mbd-96e82eb073', FONTS = 'mbd-fonts';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const fresh = (req, key, cache) => fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(cache).then(c => c.put(key, cp)); } return res; });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin === location.origin) {
    const key = r.mode === 'navigate' ? './index.html' : r;
    e.respondWith(caches.open(CACHE).then(c => c.match(key)).then(hit => { const net = fresh(r, key, CACHE).catch(() => hit); return hit || net; }));
    return;
  }
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(caches.open(FONTS).then(c => c.match(r)).then(hit => hit || fresh(r, r, FONTS).catch(() => hit)));
});
