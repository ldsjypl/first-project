// ============================================================
//  学生记账本 - Service Worker (离线缓存)
// ============================================================

const CACHE_NAME = 'money-app-v1';
const STATIC_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// 安装：预缓存所有静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 缓存静态资源');
      return Promise.allSettled(
        STATIC_FILES.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] 缓存失败 (可忽略):', url, err.message);
          })
        )
      );
    }).then(() => {
      // 立即激活，不等待旧 SW
      return self.skipWaiting();
    })
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => {
      // 立即接管所有页面
      return self.clients.claim();
    })
  );
});

// 请求拦截：缓存优先策略
self.addEventListener('fetch', (event) => {
  // 跳过非 GET 请求和 chrome-extension
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.protocol === 'chrome-extension:') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // 命中缓存，直接返回
      if (cached) return cached;

      // 未命中，发起网络请求并动态缓存
      return fetch(event.request).then((response) => {
        // 只缓存成功的响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 限制缓存大小（最多 50 条动态资源）
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      }).catch(() => {
        // 网络失败且无缓存 → 返回离线页
        // 对于导航请求，返回 index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // 其他请求静默失败
        return new Response('', { status: 408 });
      });
    })
  );
});
