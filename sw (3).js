// © 2026 Cen (github.com/kexapbango) and Kin. All rights reserved.
// Pages: network-first (always the newest game, saved copy when offline).
// Art and sounds in assets/: saved copy first and refreshed in the background, so they show instantly. After you change an asset, open the game twice to see it.
// Music (assets/music/) has its own cache: the page asks us to save every song once, then songs play (and seek) offline from it. Songs not saved yet stream from the network.
var CACHE = 'pethome-v16';
var MC = 'pethome-music';
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
      return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== MC; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// answer an audio "Range" request from a saved full file
function rangeRes(res, h) {
  return res.blob().then(function (b) {
    var m = /bytes=(\d*)-(\d*)/.exec(h) || [], n = b.size, s, e;
    if (m[1] === '' && m[2] !== '' && m[2] !== undefined) { s = Math.max(0, n - (+m[2])); e = n - 1; }
    else { s = +m[1] || 0; e = (m[2] === '' || m[2] === undefined) ? n - 1 : Math.min(+m[2], n - 1); }
    if (s >= n || s > e) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + n } });
    return new Response(b.slice(s, e + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Length': String(e - s + 1), 'Content-Range': 'bytes ' + s + '-' + e + '/' + n, 'Accept-Ranges': 'bytes' } });
  });
}

// the page sends the song list: drop songs no longer listed, save the missing ones one at a time
self.addEventListener('message', function (e) {
  var d = e.data;
  if (!d || d.t !== 'music' || !Array.isArray(d.urls)) return;
  var urls = d.urls.map(function (x) { return new URL(x, self.registration.scope).href; });
  e.waitUntil(caches.open(MC).then(function (c) {
    return c.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return urls.indexOf(k.url) < 0; }).map(function (k) { return c.delete(k); }));
    }).then(function () {
      return urls.reduce(function (p, url) {
        return p.then(function () {
          return c.match(url).then(function (h) {
            if (h) return;
            return fetch(url).then(function (r) { if (r && r.status === 200) return c.put(url, r); }).catch(function () {});
          });
        });
      }, Promise.resolve());
    });
  }));
});

self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method === 'GET' && u.origin === location.origin && u.pathname.indexOf('/assets/music/') >= 0) {
    e.respondWith(caches.open(MC).then(function (c) { return c.match(e.request); }).then(function (m) {
      if (!m) return fetch(e.request);
      var rg = e.request.headers.get('range');
      return rg ? rangeRes(m, rg) : m;
    }));
    return;
  }
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
