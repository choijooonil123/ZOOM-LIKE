# 🔧 백엔드 URL 설정 가이드

Firebase 배포 전에 Render 백엔드 URL을 설정해야 합니다.

## 📝 설정 방법

### 1. Render에서 백엔드 URL 확인

Render 대시보드에서 배포된 서비스의 URL을 확인하세요:
- 예: `https://zoom-clone-xxxx.onrender.com`

### 2. app.js 파일 수정

`static/app.js` 파일의 **5번째 줄**을 찾아서:

```javascript
const BACKEND_URL = ''; // Firebase 배포 시 Render URL로 변경 필요
```

이 부분을 다음과 같이 수정:

```javascript
const BACKEND_URL = 'https://zoom-clone-xxxx.onrender.com'; // Render 백엔드 URL
```

> **중요**: `https://` 포함해서 전체 URL을 입력하세요!

### 3. 저장 후 Firebase 배포

URL을 설정한 후:
```bash
firebase deploy --only hosting
```

---

## ✅ 확인 방법

배포 후 브라우저 콘솔(F12)에서:
- Socket.io 연결이 성공하는지 확인
- API 요청이 Render 백엔드로 가는지 확인

---

## 🔄 로컬 개발 vs 프로덕션

- **로컬 개발**: `BACKEND_URL = ''` (빈 문자열) → 같은 서버 사용
- **프로덕션**: `BACKEND_URL = 'https://your-backend.onrender.com'` → Render 백엔드 사용

