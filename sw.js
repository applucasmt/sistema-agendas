const CACHE_NAME = 'agendas-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/auth.js',
  '/assets/js/api.js',
  '/assets/js/dashboard.js',
  '/assets/js/admin.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação - Limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estratégia de cache: Network First com fallback para cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clona a resposta para cache e uso
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Fallback para cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Se não encontrar no cache, retorna página offline
            return caches.match('/offline.html');
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-agendas') {
    event.waitUntil(syncAgendas());
  }
});

async function syncAgendas() {
  try {
    // Buscar dados pendentes do IndexedDB
    const db = await openDB();
    const pending = await db.getAll('pending');
    
    for (const item of pending) {
      // Tentar enviar novamente
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(item),
        headers: { 'Content-Type': 'application/json' }
      });
      // Remover após sucesso
      await db.delete('pending', item.id);
    }
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

// Função para abrir IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AgendasDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
