# 프론트엔드 URL 설정

## 📍 프론트엔드 URL

프론트엔드 URL: **`https://screen-share-b540b.web.app/`**

## 🔧 설정 방법

### 프론트엔드 설정

프론트엔드는 `https://screen-share-b540b.web.app/`에서 호스팅되며, 백엔드 서버(`https://zoom-like.onrender.com`)와 통신합니다.

#### 백엔드 서버 URL 설정

`static/index.html`에서 백엔드 서버 URL을 설정할 수 있습니다:

```javascript
// 백엔드 서버 URL 설정
window.API_BASE_URL = 'https://zoom-like.onrender.com';
window.SOCKET_SERVER_URL = 'https://zoom-like.onrender.com';
```

#### URL 파라미터로 백엔드 URL 설정 (선택사항)

```
https://screen-share-b540b.web.app/?backend=https://your-backend-server.com&room=room-01
```

- `backend`: 백엔드 서버 URL
- `room`: 자동으로 입장할 방 ID

### 백엔드 설정

백엔드 서버는 프론트엔드 URL을 허용하도록 설정되어 있습니다.

#### 환경 변수 설정

```bash
FRONTEND_URL=https://screen-share-b540b.web.app
```

#### CORS 설정

`server.py`에서 프론트엔드 URL이 자동으로 허용됩니다:

```python
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://screen-share-b540b.web.app")
```

### Socket.io 연결

프론트엔드에서 Socket.io는 `window.SOCKET_SERVER_URL`로 설정된 백엔드 서버에 연결합니다.

## 📝 URL 파라미터 기능

### 방 자동 입장

```
https://screen-share-b540b.web.app/?room=room-01
```

URL에 `room` 파라미터가 있으면 자동으로 해당 방 ID가 입력됩니다.

## ✅ 확인 사항

1. **백엔드 서버 URL**: `https://zoom-like.onrender.com` (설정 완료)
2. **CORS 설정**: 백엔드 서버가 프론트엔드 URL을 허용하는지 확인
3. **HTTPS**: 프론트엔드와 백엔드 모두 HTTPS 사용 권장

## 🔗 관련 파일

- 프론트엔드 설정: `static/index.html`
- 프론트엔드 스크립트: `static/app.js`
- 백엔드 CORS 설정: `server.py`
