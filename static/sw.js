// Service Worker - 오프라인 지원 및 캐싱
const CACHE_NAME = 'zoom-clone-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/manifest.json'
];

// Chrome 확장 프로그램 메시지 처리 (에러 방지)
self.addEventListener('message', (event) => {
    // 확장 프로그램 메시지는 무시
    if (event.data && event.data.type && event.data.type.startsWith('chrome-extension')) {
        return;
    }
    
    // 일반 메시지는 처리
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 설치 이벤트
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('캐시 열기');
                // chrome-extension 등의 unsupported 스키마를 제외한 리소스만 캐시
                return cache.addAll(
                    urlsToCache.map(url => {
                        try {
                            // 상대 경로를 절대 경로로 변환
                            const absoluteUrl = new URL(url, self.location.origin).href;
                            return absoluteUrl;
                        } catch (e) {
                            console.warn(`캐시할 수 없는 URL: ${url}`, e);
                            return null;
                        }
                    }).filter(url => url !== null)
                );
            })
            .catch((error) => {
                console.error('캐시 설치 실패:', error);
            })
    );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// fetch 이벤트 - 네트워크 우선, 실패 시 캐시 사용
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // chrome-extension, chrome:// 등 unsupported 스키마는 처리하지 않음
    if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:') {
        return;
    }
    
    // Socket.io 요청은 Service Worker를 통과하지 않음 (WebSocket/polling 요청)
    if (url.pathname.includes('/socket.io/') || url.hostname.includes('zoom-like.onrender.com')) {
        return;
    }
    
    // API 요청도 Service Worker를 통과하지 않음 (실시간 통신)
    if (url.pathname.includes('/api/')) {
        return;
    }
    
    // 외부 도메인 요청은 Service Worker를 통과하지 않음
    if (url.origin !== self.location.origin) {
        return;
    }
    
    // GET 요청만 캐싱
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 유효한 응답만 캐시
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then((cache) => {
                        // 안전하게 캐시에 추가 (실패해도 계속 진행)
                        try {
                            cache.put(event.request, responseToCache);
                        } catch (e) {
                            console.warn('캐시 저장 실패:', e);
                        }
                    });

                return response;
            })
            .catch(() => {
                // 네트워크 실패 시 캐시에서 가져오기
                return caches.match(event.request);
            })
    );
});
