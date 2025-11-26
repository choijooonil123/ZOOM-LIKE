# 🔥 Firebase 배포 가이드

Firebase를 사용하여 ZOOM 클론 애플리케이션을 배포하는 방법입니다.

## 📋 배포 전략

이 프로젝트는 **Socket.io**를 사용하므로, 다음과 같이 배포합니다:

1. **Firebase Hosting**: 프론트엔드 정적 파일 (HTML, CSS, JS)
2. **Firebase Functions**: 백엔드 API 엔드포인트
3. **Cloud Run** (선택): Socket.io 서버 (또는 Render 등 별도 서버)

> **참고**: Firebase Functions는 Socket.io를 직접 지원하지 않으므로, Socket.io는 별도 서버가 필요합니다.

---

## 🚀 방법 1: Firebase Hosting + Render 백엔드 (추천)

가장 간단한 방법입니다.

### 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름: `zoom-clone` (또는 원하는 이름)
4. Google Analytics 설정 (선택사항)
5. **"프로젝트 만들기"** 클릭

### 2단계: Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 3단계: Firebase 로그인

```bash
firebase login
```

브라우저가 열리면 Google 계정으로 로그인

### 4단계: Firebase 프로젝트 초기화

프로젝트 폴더에서:

```bash
firebase init hosting
```

설정:
- **What do you want to use as your public directory?**: `static`
- **Configure as a single-page app?**: `No`
- **Set up automatic builds and deploys with GitHub?**: `No` (또는 원하면 Yes)

### 5단계: firebase.json 생성

프로젝트 루트에 `firebase.json` 파일이 생성됩니다. 다음과 같이 수정:

```json
{
  "hosting": {
    "public": "static",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### 6단계: app.js 수정 (백엔드 URL 변경)

`static/app.js` 파일에서 Socket.io 연결 부분을 찾아서:

```javascript
// 기존
this.socket = io();

// 변경 (Render 백엔드 URL 사용)
this.socket = io('https://your-backend.onrender.com');
```

그리고 API 요청도:

```javascript
// 기존
const response = await fetch('/api/register', {

// 변경
const response = await fetch('https://your-backend.onrender.com/api/register', {
```

### 7단계: 배포

```bash
firebase deploy --only hosting
```

### 8단계: 접속

배포가 완료되면 Firebase가 URL을 제공합니다:

```
https://your-project-id.web.app
또는
https://your-project-id.firebaseapp.com
```

---

## 🚀 방법 2: Firebase Hosting + Firebase Functions (고급)

Socket.io는 별도 서버가 필요하지만, API는 Functions로 배포할 수 있습니다.

### 1단계: Firebase Functions 설정

```bash
firebase init functions
```

설정:
- **Language**: `Python` (또는 `Node.js`)
- **Install dependencies**: `Yes`

### 2단계: Functions 코드 작성

`functions/main.py` (Python 사용 시):

```python
from firebase_functions import https_fn
from firebase_admin import initialize_app
import json

initialize_app()

@https_fn.on_request(cors=https_fn.CorsOptions(
    cors_origins=["*"],
    cors_methods=["GET", "POST", "PUT", "DELETE"]
))
def api(req: https_fn.Request) -> https_fn.Response:
    # FastAPI 엔드포인트를 여기에 구현
    # 또는 Render 백엔드로 프록시
    pass
```

### 3단계: 배포

```bash
firebase deploy --only functions,hosting
```

---

## 🚀 방법 3: Firebase Hosting + Cloud Run (Socket.io 포함)

Socket.io를 포함한 전체 백엔드를 Cloud Run에 배포합니다.

### 1단계: Dockerfile 생성

프로젝트 루트에 `Dockerfile` 생성:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["python", "server.py"]
```

### 2단계: Cloud Run에 배포

```bash
# Google Cloud CLI 설치 및 로그인
gcloud auth login

# 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# Cloud Run에 배포
gcloud run deploy zoom-clone-backend \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars SECRET_KEY=your-secret-key
```

### 3단계: app.js 수정

Cloud Run URL로 변경:

```javascript
this.socket = io('https://zoom-clone-backend-xxxxx.run.app');
```

### 4단계: Firebase Hosting 배포

```bash
firebase deploy --only hosting
```

---

## 📝 환경 변수 설정

### Firebase Hosting

환경 변수는 직접 설정할 수 없으므로, `app.js`에서 하드코딩하거나 빌드 시 주입해야 합니다.

### Firebase Functions / Cloud Run

환경 변수는 배포 시 설정:

```bash
# Functions
firebase functions:config:set secret.key="your-secret-key"

# Cloud Run
gcloud run services update zoom-clone-backend \
  --set-env-vars SECRET_KEY=your-secret-key
```

---

## ⚠️ 주의사항

### Socket.io와 Firebase

- **Firebase Functions는 Socket.io를 직접 지원하지 않습니다**
- Socket.io를 사용하려면 **Cloud Run** 또는 **별도 서버** (Render 등)가 필요합니다

### 무료 플랜 제한

- **Firebase Hosting**: 무료 (10GB 저장, 360MB/일 전송)
- **Firebase Functions**: 무료 (2M 호출/월)
- **Cloud Run**: 무료 (2M 요청/월, 360,000 GiB-초)

### HTTPS

- Firebase Hosting은 자동으로 HTTPS를 제공합니다 ✅
- 카메라/마이크 접근에 HTTPS가 필요하므로 필수입니다

---

## 🔄 업데이트 배포

코드를 수정한 후:

```bash
# Hosting만 업데이트
firebase deploy --only hosting

# Functions 업데이트
firebase deploy --only functions

# 모두 업데이트
firebase deploy
```

---

## 🆘 문제 해결

### CORS 오류

Firebase Hosting과 백엔드가 다른 도메인이면 CORS 설정 필요:

```python
# server.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-project-id.web.app",
        "https://your-project-id.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Socket.io 연결 실패

- 백엔드 서버가 실행 중인지 확인
- CORS 설정 확인
- 네트워크 탭에서 WebSocket 연결 확인

---

## ✅ 추천 구성

**가장 간단하고 안정적인 구성:**

1. **Firebase Hosting**: 프론트엔드 배포
2. **Render**: 백엔드 + Socket.io 배포
3. **Firestore** (선택): 실시간 데이터베이스

이 구성이 가장 설정이 간단하고 무료 플랜도 넉넉합니다!

---

## 📚 참고 자료

- [Firebase Hosting 문서](https://firebase.google.com/docs/hosting)
- [Firebase Functions 문서](https://firebase.google.com/docs/functions)
- [Cloud Run 문서](https://cloud.google.com/run/docs)

---

**문제가 있으면 Firebase Console의 로그를 확인하거나, 에러 메시지를 알려주세요!** 🆘

