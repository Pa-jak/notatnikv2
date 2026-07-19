// Service Worker dla Notatnika (PWA offline).
// Placeholdery __BUILD_ID__ i __PRECACHE__ są podmieniane przez build-web.mjs.
const BUILD_ID = "__BUILD_ID__";
const PRECACHE = __PRECACHE__;

const CACHE_NAME = `notatnik-${BUILD_ID}`;

// -----------------------------------------------------------
// Install — zapisujemy zasoby precache w wyznaczonej wersji cache.
// -----------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// -----------------------------------------------------------
// Activate — usuwamy stare cache o innym BUILD_ID, przejmujemy klientów.
// -----------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("notatnik-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// -----------------------------------------------------------
// Fetch — obsługujemy tylko GET i same-origin.
// -----------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Obsługujemy wyłącznie metodę GET.
  if (request.method !== "GET") {
    return;
  }

  // Obsługujemy wyłącznie żądania same-origin.
  try {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
      return;
    }

    const pathname = url.pathname;

    // API pod /api — zawsze sieć, nie przechwytujemy.
    if (pathname.startsWith("/api")) {
      return;
    }

    // Nawigacja — network-first z fallbackiem do /index.html.
    if (request.mode === "navigate") {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", clone));
            }
            return response;
          })
          .catch(() =>
            caches
              .match("/index.html")
              .then((cached) => cached || caches.match("/"))
          )
      );
      return;
    }

    // Statyczne zasoby Expo, zasoby runtime, ikony i manifest — cache-first.
    if (
      pathname.startsWith("/_expo/") ||
      pathname.startsWith("/assets/") ||
      pathname === "/manifest.webmanifest" ||
      pathname === "/icon-192.png" ||
      pathname === "/icon-512.png"
    ) {
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) {
            return cached;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          });
        })
      );
      return;
    }

    // Pozostałe żądania same-origin — network z fallbackiem do cache.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  } catch (_error) {
    // Błędny URL — ignorujemy.
  }
});
