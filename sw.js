// ═══════════════════════════════════════════════════════════════
// PeptideScanner — Service Worker v1.0
// Cache offline + mise à jour automatique
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'peptidescanner-v1.1';
const CACHE_STATIC = 'peptidescanner-static-v1.1';
const CACHE_DYNAMIC = 'peptidescanner-dynamic-v1.1';

// ── FICHIERS À METTRE EN CACHE (core app shell) ────────────────
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/onboarding.html',
  '/dashboard.html',
  '/peptide-database.html',
  '/cure.html',
  '/poids.html',
  '/alertes.html',
  '/profil.html',
  '/ia.html',
  '/boutiques.html',
  '/inventaire.html',
  '/calculateur.html',
  '/lang.js',
  '/manifest.json',
  // Fonts Google (si disponibles offline)
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap'
];

// ── INSTALL : mise en cache de l'app shell ─────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installation en cours…');
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        console.log('[SW] Mise en cache des assets statiques');
        // Mise en cache individuelle pour éviter l'échec total si une ressource manque
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => console.warn('[SW] Échec cache:', url, err))
          )
        );
      })
      .then(() => {
        console.log('[SW] Installation terminée');
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE : nettoyage des anciens caches ────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activation…');
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_STATIC && key !== CACHE_DYNAMIC)
            .map(key => {
              console.log('[SW] Suppression ancien cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation terminée — contrôle des clients');
        return self.clients.claim();
      })
  );
});

// ── FETCH : stratégie cache ────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les extensions Chrome et requêtes externes non souhaitées
  if (url.protocol === 'chrome-extension:') return;

  // Stratégie selon le type de ressource
  if (isStaticAsset(request)) {
    // Cache First — pour les pages HTML et assets de l'app
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request)) {
    // Network Only — pour les appels API (ne jamais cacher)
    event.respondWith(networkOnly(request));
  } else {
    // Stale While Revalidate — pour le reste
    event.respondWith(staleWhileRevalidate(request));
  }
});

// ── STRATÉGIES ─────────────────────────────────────────────────

// Cache First : retourne le cache, sinon fetch et met en cache
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineFallback(request);
  }
}

// Network Only : toujours fetcher depuis le réseau
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Hors ligne — requête impossible' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Stale While Revalidate : retourne le cache immédiatement, update en arrière-plan
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(CACHE_DYNAMIC).then(cache => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// ── HELPERS ────────────────────────────────────────────────────

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.endsWith('.html')
    || url.pathname.endsWith('.css')
    || url.pathname.endsWith('.js')
    || url.pathname.endsWith('.json')
    || url.pathname.endsWith('.png')
    || url.pathname.endsWith('.jpg')
    || url.pathname.endsWith('.svg')
    || url.pathname.endsWith('.ico')
    || url.pathname === '/';
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.hostname.includes('api.anthropic.com')
    || url.hostname.includes('supabase.co')
    || url.pathname.startsWith('/api/');
}

// Page offline de fallback
async function offlineFallback(request) {
  if (request.headers.get('Accept')?.includes('text/html')) {
    const cached = await caches.match('/dashboard.html');
    if (cached) return cached;

    return new Response(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PeptideScanner — Hors ligne</title>
        <style>
          body { font-family: sans-serif; background: #F8F9FA; color: #1F2937;
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; min-height: 100vh; text-align: center; padding: 24px; }
          .icon { font-size: 4rem; margin-bottom: 20px; }
          h1 { font-size: 1.4rem; margin-bottom: 10px; color: #0D9488; }
          p { color: #6B7280; line-height: 1.6; max-width: 300px; }
          button { margin-top: 24px; padding: 12px 28px; background: #0D9488; color: #fff;
            border: none; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="icon">📡</div>
        <h1>Vous êtes hors ligne</h1>
        <p>PeptideScanner nécessite une connexion pour certaines fonctionnalités.<br>
        Vos données locales restent accessibles.</p>
        <button onclick="window.location.reload()">Réessayer</button>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  return new Response('Ressource non disponible hors ligne', { status: 503 });
}

// ── PUSH NOTIFICATIONS ─────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); }
  catch { data = { title: 'PeptideScanner', body: event.data.text() }; }

  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/dashboard.html' },
    actions: [
      { action: 'open', title: 'Ouvrir', icon: '/icons/icon-96.png' },
      { action: 'dismiss', title: 'Ignorer' }
    ],
    tag: data.tag || 'peptidescanner-notif',
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PeptideScanner', options)
  );
});

// ── NOTIFICATION CLICK ─────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Chercher une fenêtre déjà ouverte
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Ouvrir une nouvelle fenêtre
        return clients.openWindow(url);
      })
  );
});

// ── BACKGROUND SYNC ────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Synchroniser les données offline vers le serveur
  // Sera implémenté avec Supabase
  console.log('[SW] Sync des données en arrière-plan…');
}

// ── MESSAGE FROM PAGE ──────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data?.action === 'getCacheVersion') {
    event.source.postMessage({ cacheVersion: CACHE_NAME });
  }
});

console.log('[SW] Service Worker PeptideScanner v1.0 chargé');
