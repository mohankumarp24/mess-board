const CACHE_NAME = "mess-board-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the HTML page itself, so menu edits show up immediately
// whenever there's a connection. Falls back to cache only when offline.
// Other static assets (icon, manifest) stay cache-first since they rarely
// change and this keeps things fast/offline-friendly.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isHTML = event.request.mode === "navigate" ||
                 event.request.url.endsWith("/") ||
                 event.request.url.endsWith("index.html");

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
