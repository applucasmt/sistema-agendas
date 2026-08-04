/**
 * Service Worker - Sistema de Agendas
 * @version 1.0.0
 */

const CACHE_NAME = 'agendas-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/admin.html',
  '/offline.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/css/admin.css',
  '/assets/css/components.css',
  '/assets/js/app.js',
  '/assets/js/auth.js',
  '/assets/js/api.js',
  '/assets/js/dashboard.js',
  '/assets/js/admin.js',
  '/assets/js/components/modal.js',
  '/assets/js/components/agenda-detail.js',
  '/assets/js/utils.js',
  '/assets/js/validators.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// URLs que NÃO devem ser interceptadas
const EXCLUDED_URLS = [
  'script.google.com',
  'googleapis.com',
  'gstatic.com'
];

/**
 * Verifica se a URL deve ser ignorada
 */
function shouldIgnoreUrl(url) {
  try {
    const urlObj = new URL(url);
    return EXCLUDED_URLS.some(excluded => urlObj.hostname.includes(excluded));
  } catch {
    return false;
  }
}

// ============================================
// INSTALAÇÃO
// ============================================

self.addEventListener('install', event => {
  console.log('🔄 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache aberto');
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('✅ Arquivos cacheados com sucesso');
          })
          .catch(err => {
            console.warn('⚠️ Erro ao cachear alguns arquivos:', err);
          });
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================
// ATIVAÇÃO
// ============================================

self.addEventListener('activate', event => {
  console.log('🔄 Service Worker: Ativando...');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
    .then(() => {
      console.log('✅ Service Worker ativado com sucesso');
    })
  );
});

// ============================================
// INTERCEPTAÇÃO DE REQUISIÇÕES
// ============================================

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // IGNORAR requisições para Google Apps Script e APIs externas
  if (shouldIgnoreUrl(url)) {
    console.log('⏩ Ignorando requisição (API externa):', url);
    return;
  }

  // IGNORAR requisições para analytics e tracking
  if (url.includes('google-analytics') || url.includes('gtag')) {
    return;
  }

  // IGNORAR requisições de extensões do navegador
  if (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://')) {
    return;
  }

  // Estratégia: Network First com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clona a resposta para cache
        const responseToCache = response.clone();
        
        // Cache apenas recursos estáticos
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME)
            .then(cache => {
              try {
                cache.put(event.request, responseToCache);
              } catch (err) {
                console.warn('⚠️ Erro ao cachear:', event.request.url, err);
              }
            });
        }
        
        return response;
      })
      .catch(() => {
        console.log('📡 Offline: Buscando no cache...', event.request.url);
        
        return caches.match(event.request)
          .then(response => {
            if (response) {
              console.log('✅ Encontrado no cache:', event.request.url);
              return response;
            }
            
            // Se for uma página HTML, retorna página offline
            if (event.request.headers.get('accept')?.includes('text/html')) {
              console.log('📄 Retornando página offline');
              return caches.match('/offline.html');
            }
            
            // Para outros recursos, retorna erro
            console.warn('❌ Recurso não encontrado no cache:', event.request.url);
            return new Response('Recurso não disponível offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// ============================================
// SINCRONIZAÇÃO EM BACKGROUND
// ============================================

self.addEventListener('sync', event => {
  if (event.tag === 'sync-agendas') {
    console.log('🔄 Sincronizando agendas...');
    event.waitUntil(syncAgendas());
  }
});

async function syncAgendas() {
  try {
    // Buscar dados pendentes do IndexedDB
    const db = await openDB();
    const pending = await db.getAll('pending');
    
    console.log(`📤 ${pending.length} itens pendentes para sincronizar`);
    
    for (const item of pending) {
      try {
        // Tentar enviar novamente
        const response = await fetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify(item),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          // Remover após sucesso
          await db.delete('pending', item.id);
          console.log('✅ Item sincronizado:', item.id);
        }
      } catch (err) {
        console.warn('⚠️ Erro ao sincronizar item:', item.id, err);
      }
    }
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// ============================================
// INDEXEDDB HELPER
// ============================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AgendasDB', 1);
    
    request.onerror = () => {
      console.error('❌ Erro ao abrir IndexedDB:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      console.log('✅ IndexedDB aberto com sucesso');
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('🔄 Atualizando IndexedDB...');
      
      if (!db.objectStoreNames.contains('pending')) {
        const store = db.createObjectStore('pending', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
        console.log('✅ Store "pending" criada');
      }
    };
  });
}

// ============================================
// NOTIFICAÇÕES PUSH
// ============================================

self.addEventListener('push', event => {
  console.log('📬 Push recebido:', event);
  
  let data = {
    title: 'Nova Notificação',
    body: 'Você tem uma nova notificação',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/icon-192.png'
  };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.warn('⚠️ Erro ao parsear dados do push:', error);
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/assets/images/icon-192.png',
      badge: data.badge || '/assets/images/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.url || '/dashboard.html'
    })
  );
});

// ============================================
// CLIQUE EM NOTIFICAÇÃO
// ============================================

self.addEventListener('notificationclick', event => {
  console.log('🔔 Notificação clicada:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/dashboard.html';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(windowClients => {
      // Verifica se já existe uma janela aberta
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ============================================
// LOGS
// ============================================

console.log('🔧 Service Worker inicializado');
console.log('📦 Cache:', CACHE_NAME);
console.log('🚫 URLs ignoradas:', EXCLUDED_URLS);
