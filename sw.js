// Velma AI — Service Worker for PWA support
const CACHE_NAME = "velma-ai-v1";
const ASSETS = [
    "/",
    "/index.html",
    "/style.css",
    "/script.js",
    "/profile.js",
    "/projects.txt",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // Always go to network for API calls
    if (event.request.url.includes("anthropic.com")) return;
    // Always go to network for CDN resources
    if (event.request.url.includes("cdnjs.cloudflare.com")) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
