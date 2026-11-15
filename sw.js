// © 2026 Cen (github.com/kexapbango) and Kin. All rights reserved.
// Pages: network-first (always the newest game, saved copy when offline).
// Art and sounds in assets/: saved copy first and refreshed in the background, so they show instantly. After you change an asset, open the game twice to see it.
// Music (music/) and any range request (audio streaming) are left to the browser.
var CACHE = 'pethome-v15';
var FILES = ['./', 'index.html', 'aquarium.html', 'manifest.json', 'icon-192.png', 'icon-512.png'
,
  "assets/furniture/fire_on.webp",
  "assets/furniture/fire_off.webp",
  "assets/pets/axo/tail.webp",
  "assets/pets/axo/legL.webp",
  "assets/pets/axo/legR.webp",
  "assets/pets/axo/torso.webp",
  "assets/pets/axo/armL.webp",
  "assets/pets/axo/armR.webp",
  "assets/pets/axo/head.webp",
  "assets/pets/axo/gillL.webp",
  "assets/pets/axo/gillR.webp",
  "assets/pets/monkey/tail.webp",
  "assets/pets/monkey/legL.webp",
  "assets/pets/monkey/legR.webp",
  "assets/pets/monkey/torso.webp",
  "assets/pets/monkey/armL.webp",
  "assets/pets/monkey/armR.webp",
  "assets/pets/monkey/head.webp",
  "assets/ui/icon_axo.webp",
  "assets/ui/icon_monkey.webp",
  "assets/outside/bg.webp",
  "assets/outside/house.webp",
  "assets/outside/tree.webp",
  "assets/outside/treeL.webp",
  "assets/outside/bush.webp",
  "assets/outside/bushA.webp",
  "assets/outside/cloud1.webp",
  "assets/outside/cloud2.webp",
  "assets/outside/sun.webp",
  "assets/outside/fence.webp",
  "assets/audio/aquarium_ambient.mp3",
  "assets/audio/aquarium_tap.wav",
  "assets/aquarium/atlas.png"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || e.request.headers.has('range') || (u.origin !== location.origin && e.request.url.indexOf("gstatic.com/firebasejs/") < 0)) return;
  if (u.origin === location.origin && u.pathname.indexOf('/assets/') >= 0) {
    e.respondWith(caches.match(e.request).then(function (m) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
        return res;
      }).catch(function () { return m; });
      return m || net;
    }));
    return;
  }
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (m) { return m || caches.match('index.html'); });
    })
  );
});
