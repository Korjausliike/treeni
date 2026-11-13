// Treenilokin puhelinsivu: sivun runko välimuistiin, jotta se aukeaa ilman verkkoa.
// Tilannekuva (data.json) ei kulje tämän kautta: sivu hakee sen itse ja pitää viimeisimmän tallessa.
const CACHE = "treeniloki-1";
const SHELL = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.endsWith("/data.json")) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    if (hit) e.waitUntil(net);          // näytetään tallennettu heti, päivitetään taustalla seuraavaa kertaa varten
    return hit || net;
  }));
});
