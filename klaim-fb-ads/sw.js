/* Service worker aplikasi Laporan Activity Marketing.
 *
 * Versi sebelumnya selalu mengambil dari simpanan lebih dulu, akibatnya
 * pembaruan di server tidak pernah sampai ke HP. Sekarang halaman dan
 * berkas pengaturannya diambil dari jaringan lebih dulu; simpanan hanya
 * dipakai kalau sedang tidak ada internet.
 *
 * Naikkan angka VERSI setiap kali index.html diganti.
 */
const VERSI = 'v10';
const CACHE = 'klaim-fbads-' + VERSI;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Yang harus selalu segar: halaman itu sendiri dan berkas pengaturannya. */
function selaluSegar(url, req) {
  if (req.mode === 'navigate') return true;
  return /\.(html|webmanifest|json)$/i.test(url.pathname) || url.pathname.endsWith('/');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== location.origin) return;

  if (selaluSegar(url, req)) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const salinan = res.clone();
            caches.open(CACHE).then(c => c.put(req, salinan));
          }
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) {
        const salinan = res.clone();
        caches.open(CACHE).then(c => c.put(req, salinan));
      }
      return res;
    }))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'perbarui') self.skipWaiting();
});
