# 🚀 Render 배포 가이드

## 1단계: GitHub에 코드 푸시

먼저 현재 변경사항을 GitHub에 푸시해야 합니다:

```bash
# 변경사항 추가
git add .

# 커밋
git commit -m "Render 배포 설정 추가"

# GitHub에 푸시
git push origin main
```

---

## 2단계: Render 계정 생성 및 로그인

1. [render.com](https://render.com) 접속
2. "Get Started for Free" 클릭
3. GitHub 계정으로 로그인 (권장) 또는 이메일로 가입

---

## 3단계: 새 Web Service 생성

1. Render 대시보드에서 **"New +"** 버튼 클릭
2. **"Web Service"** 선택
3. GitHub 저장소 연결:
   - "Connect account" 클릭 (아직 연결 안 했다면)
   - 저장소 목록에서 `ZOOM` 저장소 선택
   - "Connect" 클릭

---

## 4단계: 서비스 설정

Render가 자동으로 `render.yaml` 파일을 인식하지만, 수동 설정도 가능합니다:

### 자동 설정 (render.yaml 사용)
- Render가 자동으로 설정을 읽어옵니다 ✅

### 수동 설정 (선택사항)
만약 수동으로 설정하려면:

- **Name**: `zoom-clone` (원하는 이름)
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn server:socket_app --host 0.0.0.0 --port $PORT`
- **Plan**: `Free` (무료 플랜 선택)

---

## 5단계: 환경 변수 설정 (선택사항)

현재는 추가 환경 변수가 필요하지 않지만, 필요시:
- Settings → Environment → Add Environment Variable

---

## 6단계: 배포 시작

1. **"Create Web Service"** 클릭
2. 배포가 자동으로 시작됩니다
3. 배포 로그를 확인할 수 있습니다

---

## 7단계: 배포 완료 확인

1. 배포가 완료되면 (약 2-5분 소요)
2. Render가 자동으로 URL을 생성합니다:
   - 예: `https://zoom-clone.onrender.com`
3. 해당 URL로 접속하여 테스트

---

## ⚠️ 주의사항

### 무료 플랜 제한사항:
- **슬리프 모드**: 15분간 요청이 없으면 서버가 잠들어요
- 첫 요청 시 깨어나는데 약 30초~1분 소요
- **월 트래픽**: 제한적

### WebSocket 연결:
- Render는 WebSocket을 지원합니다 ✅
- Socket.io가 정상 작동합니다

### HTTPS:
- Render는 자동으로 HTTPS를 제공합니다 ✅
- 카메라/마이크 접근에 HTTPS가 필요하므로 필수입니다

---

## 🔄 업데이트 배포

코드를 수정한 후:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

Render가 자동으로 변경사항을 감지하고 재배포합니다!

---

## 📊 모니터링

- Render 대시보드에서 로그 확인 가능
- Metrics 탭에서 CPU, 메모리 사용량 확인
- Events 탭에서 배포 이력 확인

---

## 🆘 문제 해결

### 배포 실패 시:
1. **Logs** 탭에서 오류 메시지 확인
2. `requirements.txt`에 모든 의존성이 있는지 확인
3. `render.yaml` 파일이 올바른지 확인

### 서버가 응답하지 않을 때:
1. 첫 요청은 슬리프 모드에서 깨어나는데 시간이 걸릴 수 있음
2. Health check 엔드포인트 확인: `https://your-app.onrender.com/health`

---

## ✅ 체크리스트

배포 전 확인:
- [ ] `render.yaml` 파일이 있음
- [ ] `requirements.txt`에 모든 의존성이 있음
- [ ] `server.py`가 PORT 환경 변수를 사용함
- [ ] GitHub에 코드가 푸시됨
- [ ] Render 계정이 생성됨
- [ ] GitHub 저장소가 Render에 연결됨

---

## 🎉 완료!

배포가 완료되면 전 세계 어디서나 접속 가능한 URL이 생성됩니다!

**예시 URL**: `https://zoom-clone-xxxx.onrender.com`

이 URL을 상대방에게 공유하면 됩니다! 🚀

