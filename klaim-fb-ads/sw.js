/* Service worker — supaya aplikasi tetap terbuka saat iPhone luring.
   Naikkan angka VER setiap kali index.html diganti, supaya HP menarik versi baru. */
var VER = 'stok-daihatsu-v1';

var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon-180.png',
  './icons/apple-touch-icon-167.png',
  './icons/apple-touch-icon-152.png',
  './icons/apple-touch-icon-120.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(VER).then(function(c){
      /* satu berkas gagal tidak boleh menggagalkan pemasangan */
      return Promise.all(SHELL.map(function(u){
        return c.add(u).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(k){
      return Promise.all(k.map(function(n){ return n===VER ? null : caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;

  var url = new URL(req.url);

  /* Data spreadsheet Google: selalu ambil dari jaringan, jangan pernah disimpan.
     Kalau gagal, aplikasi sudah punya simpanannya sendiri di localStorage. */
  if(url.hostname.indexOf('google.com') >= 0 || url.hostname.indexOf('googleusercontent.com') >= 0){
    return;
  }

  /* Kerangka aplikasi: pakai simpanan dulu supaya cepat, sambil disegarkan di latar. */
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(req).then(function(hit){
        var net = fetch(req).then(function(res){
          if(res && res.status === 200){
            var copy = res.clone();
            caches.open(VER).then(function(c){ c.put(req, copy); });
          }
          return res;
        }).catch(function(){ return hit; });
        return hit || net;
      })
    );
  }
});
