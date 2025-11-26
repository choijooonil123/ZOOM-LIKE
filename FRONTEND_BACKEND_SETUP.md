# 프론트엔드-백엔드 분리 설정 가이드

## 📍 현재 설정

- **프론트엔드 URL**: `https://screen-share-b540b.web.app/`
- **백엔드 서버**: `https://zoom-like.onrender.com`

## 🔧 설정 완료된 항목

### 1. 프론트엔드 설정 (`static/index.html`)

✅ API 호출이 백엔드 서버로 전송되도록 설정
✅ Socket.io 연결이 백엔드 서버로 설정
✅ URL 파라미터로 백엔드 URL 설정 가능
✅ URL 파라미터로 방 자동 입장 기능

### 2. 백엔드 설정 (`server.py`)

✅ CORS에 프론트엔드 URL (`https://screen-share-b540b.web.app`) 허용
✅ Socket.io CORS 설정에 프론트엔드 URL 포함

## 📝 백엔드 서버 URL 설정 방법

### 방법 1: `static/index.html`에서 직접 설정 (권장)

`static/index.html` 파일을 열어서 다음 부분을 수정:

```javascript
// 백엔드 서버 URL 설정 (이미 설정됨)
window.API_BASE_URL = 'https://zoom-like.onrender.com';
window.SOCKET_SERVER_URL = 'https://zoom-like.onrender.com';
```

### 방법 2: URL 파라미터로 설정

프론트엔드 URL에 백엔드 서버 URL을 파라미터로 전달:

```
https://screen-share-b540b.web.app/?backend=https://your-backend-server.com&room=room-01
```

### 방법 3: 배포 환경에서 설정

Firebase Hosting이나 다른 호스팅 서비스에서 환경 변수로 설정:

```javascript
// 배포 환경에서 설정
window.API_BASE_URL = process.env.API_BASE_URL || 'https://your-backend-server.com';
```

## 🚀 테스트 방법

### 1. 백엔드 서버 실행

백엔드 서버를 실행합니다 (예: Render, Railway 등에서 배포).

### 2. 프론트엔드에서 백엔드 URL 설정

`static/index.html`에서 `API_BASE_URL`을 실제 백엔드 서버 URL로 변경합니다.

### 3. 프론트엔드 배포

변경된 `index.html`을 Firebase Hosting에 배포합니다.

### 4. 연결 테스트

1. 프론트엔드 접속: `https://screen-share-b540b.web.app/`
2. 개발자 도구 콘솔에서 연결 확인
3. 회원가입/로그인 테스트
4. Socket.io 연결 테스트

## ✅ 확인 사항

- [ ] 백엔드 서버 URL이 올바르게 설정되었는지
- [ ] CORS 설정이 프론트엔드 URL을 허용하는지
- [ ] Socket.io 연결이 정상 작동하는지
- [ ] API 호출이 정상 작동하는지
- [ ] HTTPS 사용 (필수)

## 🔗 관련 파일

- 프론트엔드 설정: `static/index.html`
- 프론트엔드 스크립트: `static/app.js`
- 백엔드 CORS 설정: `server.py`
- 프론트엔드 URL 문서: `FRONTEND_URL.md`

