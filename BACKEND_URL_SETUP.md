# 백엔드 서버 URL 설정 가이드

## 📍 현재 설정

**백엔드 서버 URL**: `https://zoom-like.onrender.com` ✅ (설정 완료)

## 🔗 연결 정보

- **프론트엔드**: `https://screen-share-b540b.web.app/`
- **백엔드 서버**: `https://zoom-like.onrender.com`
- **API 엔드포인트**: `https://zoom-like.onrender.com/api/*`
- **Socket.io**: `https://zoom-like.onrender.com/socket.io/`

## ✅ 설정 완료된 항목

1. ✅ `static/index.html`에 백엔드 URL 설정 완료
2. ✅ API 호출이 백엔드 서버로 전송됨
3. ✅ Socket.io 연결이 백엔드 서버로 설정됨
4. ✅ 백엔드 CORS에 프론트엔드 URL 허용됨

## 🔧 현재 설정

### 프론트엔드 (`static/index.html`)

```javascript
window.API_BASE_URL = 'https://zoom-like.onrender.com';
window.SOCKET_SERVER_URL = 'https://zoom-like.onrender.com';
```

### 백엔드 (`server.py`)

- CORS에 `https://screen-share-b540b.web.app` 허용됨
- Socket.io CORS 설정 완료

## 🧪 테스트 방법

### 1. 헬스 체크

```
https://zoom-like.onrender.com/health
```

### 2. 프론트엔드에서 테스트

1. 프론트엔드 접속: `https://screen-share-b540b.web.app/`
2. 개발자 도구 콘솔 열기 (F12)
3. 네트워크 탭에서 API 호출 확인
4. 회원가입/로그인 테스트

### 3. API 엔드포인트 테스트

```bash
# 회원가입 테스트
curl -X POST https://zoom-like.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test1234"}'

# 헬스 체크
curl https://zoom-like.onrender.com/health
```

## 📝 URL 파라미터 사용

### 방 자동 입장

```
https://screen-share-b540b.web.app/?room=room-01
```

### 백엔드 URL 변경 (테스트용)

```
https://screen-share-b540b.web.app/?backend=https://other-backend.com&room=room-01
```

## ⚠️ 주의사항

1. **HTTPS 필수**: 프론트엔드와 백엔드 모두 HTTPS 사용
2. **CORS 설정**: 백엔드 서버가 프론트엔드 URL을 허용하는지 확인
3. **서버 상태**: Render 무료 티어는 15분 비활성 시 슬리프 모드
   - 첫 요청 시 30초~1분 소요 가능

## 🔗 관련 파일

- 프론트엔드 설정: `static/index.html` (12-13번 줄)
- 프론트엔드 스크립트: `static/app.js`
- 백엔드 설정: `server.py`
- 배포 가이드: `DEPLOY.md`, `RENDER_SETUP.md`
