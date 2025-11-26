# 설정 완료 요약

## ✅ 설정 완료

### 프론트엔드
- **URL**: `https://screen-share-b540b.web.app/`
- **설정 파일**: `static/index.html`

### 백엔드 서버
- **URL**: `https://zoom-like.onrender.com`
- **API 엔드포인트**: `https://zoom-like.onrender.com/api/*`
- **Socket.io**: `https://zoom-like.onrender.com/socket.io/`
- **헬스 체크**: `https://zoom-like.onrender.com/health`

## 🔧 설정 내용

### 1. 프론트엔드 설정 (`static/index.html`)

```javascript
window.API_BASE_URL = 'https://zoom-like.onrender.com';
window.SOCKET_SERVER_URL = 'https://zoom-like.onrender.com';
```

### 2. 백엔드 설정 (`server.py`)

- CORS에 프론트엔드 URL 허용: `https://screen-share-b540b.web.app`
- Socket.io CORS 설정: 모든 도메인 허용

## 🚀 연결 테스트

### 1. 백엔드 서버 헬스 체크

브라우저에서 접속:
```
https://zoom-like.onrender.com/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-11-27T..."
}
```

### 2. 프론트엔드 연결 테스트

1. 프론트엔드 접속: `https://screen-share-b540b.web.app/`
2. 개발자 도구 (F12) 열기
3. 콘솔 탭에서 연결 로그 확인
4. 네트워크 탭에서 API 호출 확인

### 3. 회원가입 테스트

1. 프론트엔드에서 회원가입 시도
2. 네트워크 탭에서 `https://zoom-like.onrender.com/api/register` 호출 확인
3. 응답 확인

## 📝 주요 기능

### URL 파라미터

1. **방 자동 입장**:
   ```
   https://screen-share-b540b.web.app/?room=room-01
   ```

2. **백엔드 URL 변경** (테스트용):
   ```
   https://screen-share-b540b.web.app/?backend=https://other-backend.com
   ```

## ⚠️ 주의사항

1. **Render 무료 티어 제한**:
   - 15분 비활성 시 슬리프 모드
   - 첫 요청 시 30초~1분 소요 가능
   - 슬리프 모드에서 깨어나는 시간 필요

2. **HTTPS 필수**:
   - 프론트엔드와 백엔드 모두 HTTPS 사용
   - 브라우저에서 카메라/마이크 접근 권한 필요

3. **CORS 설정**:
   - 백엔드 서버가 프론트엔드 URL을 허용하도록 설정됨

## 🔗 관련 문서

- `BACKEND_URL_SETUP.md`: 백엔드 URL 설정 상세
- `FRONTEND_URL.md`: 프론트엔드 URL 정보
- `FRONTEND_BACKEND_SETUP.md`: 프론트엔드-백엔드 분리 설정

