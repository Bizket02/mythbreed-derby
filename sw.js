// Mythbreed Derby offline support. Online, the game page always comes fresh from the network, so updates show at once;
// with no signal it opens from the saved copy. Icons and fonts come from the cache.
const CACHE = 'mbd-8d01b9bff4', FONTS = 'mbd-fonts';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const fresh = (req, key, cache) => fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(cache).then(c => c.put(key, cp)); } return res; });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin === location.origin) {
    const key = r.mode === 'navigate' ? './index.html' : r;
    if (r.mode === 'navigate') { e.respondWith(fresh(r, key, CACHE).catch(() => caches.open(CACHE).then(c => c.match(key)))); return; }   // the game itself: newest when online, the saved copy offline
    e.respondWith(caches.open(CACHE).then(c => c.match(key)).then(hit => { const net = fresh(r, key, CACHE).catch(() => hit); return hit || net; }));
    return;
  }
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(caches.open(FONTS).then(c => c.match(r)).then(hit => hit || fresh(r, r, FONTS).catch(() => hit)));
});
