// Service Worker for ZOOM Clone
// CACHE_NAME을 변경하면 기존 캐시를 무효화하고 최신 파일을 받게 됩니다.
const CACHE_NAME = 'zoom-clone-v2';
const urlsToCache = [
  '/',
  '/static/index.html',
  '/static/app.js',
  '/static/style.css',
  '/static/manifest.json'
  // 외부 CDN 리소스는 캐시하지 않음 (CORS 문제 방지)
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 열기');
        // 각 URL을 개별적으로 추가하여 실패해도 계속 진행
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`캐시 실패: ${url}`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('캐시 설치 완료');
      })
  );
  // 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// fetch 이벤트 (네트워크 우선, 캐시 폴백)
self.addEventListener('fetch', (event) => {
  // API 요청은 네트워크만 사용
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 응답이 유효한지 확인
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 응답 복제
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request);
      })
  );
});

