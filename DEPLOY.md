# ZOOM 클론 배포 가이드

## 🚫 GitHub Pages는 사용 불가

GitHub Pages는 **정적 파일(HTML, CSS, JS)만** 호스팅할 수 있어서, FastAPI + Socket.io 백엔드 서버는 호스팅할 수 없습니다.

## ✅ 무료 호스팅 옵션

### 1. **Render** (추천) ⭐
- **무료 티어**: 있음 (제한적)
- **장점**: 설정 간단, GitHub 연동 쉬움
- **단점**: 무료 티어는 15분 비활성 시 슬리프 모드

**배포 방법:**
1. [render.com](https://render.com) 가입
2. "New Web Service" 선택
3. GitHub 저장소 연결
4. 설정:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:socket_app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3
5. Deploy 클릭

---

### 2. **Railway**
- **무료 티어**: $5 크레딧/월
- **장점**: 사용한 만큼만 과금, 빠른 배포
- **단점**: 크레딧 소진 시 중단

**배포 방법:**
1. [railway.app](https://railway.app) 가입
2. "New Project" → "Deploy from GitHub repo"
3. 저장소 선택
4. 자동으로 `railway.json` 설정 인식
5. 배포 완료

---

### 3. **Fly.io**
- **무료 티어**: 3개 앱, 공유 CPU
- **장점**: 전 세계 엣지 배포, 빠른 속도
- **단점**: 설정이 다소 복잡

**배포 방법:**
1. [fly.io](https://fly.io) 가입
2. `flyctl` 설치: `curl -L https://fly.io/install.sh | sh`
3. 로그인: `flyctl auth login`
4. 앱 생성: `flyctl launch`
5. 배포: `flyctl deploy`

---

### 4. **PythonAnywhere**
- **무료 티어**: 있음 (제한적)
- **장점**: Python 전용, 간단한 설정
- **단점**: 무료 티어는 외부 접속 제한

---

## 📝 배포 전 체크리스트

### 1. 환경 변수 설정
배포 플랫폼에서 다음 환경 변수 설정:
- `PORT`: 자동 할당됨 (대부분의 플랫폼)
- `PYTHON_VERSION`: `3.11.0` (선택사항)

### 2. CORS 설정 확인
현재 `cors_allowed_origins="*"`로 설정되어 있어 모든 도메인에서 접속 가능합니다.
프로덕션에서는 특정 도메인만 허용하도록 변경하는 것을 권장합니다.

### 3. Socket.io 설정
배포 후 Socket.io 연결이 제대로 작동하는지 확인:
- WebSocket 연결이 지원되는지
- 포트가 올바르게 설정되었는지

---

## 🔧 로컬 테스트

배포 전 로컬에서 테스트:
```bash
# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python server.py
```

---

## 🌐 배포 후 접속

배포가 완료되면:
1. 플랫폼에서 제공하는 URL 확인 (예: `https://zoom-clone.onrender.com`)
2. 해당 URL로 접속
3. 같은 URL을 상대방에게 공유

---

## ⚠️ 주의사항

1. **무료 티어 제한**:
   - Render: 15분 비활성 시 슬리프 모드 (첫 요청 시 느림)
   - Railway: 크레딧 소진 시 중단
   - Fly.io: 공유 CPU 사용

2. **WebRTC 제한**:
   - 일부 호스팅 서비스는 WebRTC를 완전히 지원하지 않을 수 있음
   - STUN/TURN 서버가 필요할 수 있음

3. **HTTPS 필수**:
   - 대부분의 브라우저는 HTTPS에서만 카메라/마이크 접근 허용
   - 배포 플랫폼은 자동으로 HTTPS 제공

---

## 💡 추천

**개인 프로젝트/테스트**: **Render** (가장 간단)
**프로덕션/상용**: **Railway** 또는 **Fly.io** (더 안정적)






