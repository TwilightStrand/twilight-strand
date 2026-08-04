var CACHE_NAME = "tsc-v2";
var PRECACHE_URLS = [
  "/",
  "/data/pob/file-list.json",
  "/data/pob/TreeData/3_29/tree.json",
  "/data/pob/TreeData/3_29/sprites.json",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  // Network-first for API routes
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static assets, stale-while-revalidate for pages
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) {
        // Revalidate in background for non-data assets
        if (!event.request.url.includes("/data/")) {
          fetch(event.request)
            .then(function (response) {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then(function (cache) {
                  cache.put(event.request, response);
                });
              }
            })
            .catch(function () {});
        }
        return cached;
      }
      return fetch(event.request).then(function (response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
