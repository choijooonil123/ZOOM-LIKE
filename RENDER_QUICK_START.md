# 🚀 Render 서버 배포 빠른 가이드

## 방법 1: Public Git Repository로 직접 배포 (추천)

저장소 검색이 안 될 때 사용하는 방법입니다.

### 단계:

1. Render에서 **"Public Git Repository" 탭** 클릭

2. 저장소 URL 입력:
   ```
   https://github.com/choijooonil123/ZOOM-LIKE.git
   ```

3. **"Continue"** 클릭

4. Render가 자동으로 설정을 감지합니다:
   - ✅ `render.yaml` 파일 자동 인식
   - ✅ Python 환경 자동 설정
   - ✅ 빌드 명령어 자동 설정

5. **"Create Web Service"** 클릭

6. 배포 시작! (약 2-5분 소요)

---

## 방법 2: 수동 설정 (render.yaml이 인식되지 않을 때)

만약 자동 설정이 안 되면:

### 기본 설정:
- **Name**: `zoom-clone` (원하는 이름)
- **Environment**: `Python 3`
- **Region**: 원하는 지역 선택
- **Branch**: `main`
- **Root Directory**: (비워두기)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn server:socket_app --host 0.0.0.0 --port $PORT`
- **Plan**: `Free` 선택

### 환경 변수 (선택사항):
- `PYTHON_VERSION`: `3.11.0` (선택사항)

---

## 배포 완료 후

### 1. 서버 URL 확인
배포가 완료되면 Render가 자동으로 URL을 생성합니다:
- 예: `https://zoom-clone-xxxx.onrender.com`

### 2. 서버 테스트
브라우저에서 접속:
```
https://your-app-name.onrender.com
```

Health check:
```
https://your-app-name.onrender.com/health
```

### 3. 서버 사용 방법
- 생성된 URL을 상대방에게 공유
- 같은 URL로 접속하면 화상 회의 가능
- 회의실 ID를 공유하여 같은 방에 참가

---

## ⚙️ 서버 관리

### 로그 확인
- Render 대시보드 → Logs 탭
- 실시간 로그 확인 가능

### 재배포
코드 수정 후 GitHub에 푸시하면 자동 재배포됩니다:
```bash
git add .
git commit -m "업데이트"
git push origin main
```

### 서버 중지/시작
- Settings → Manual Deploy
- 또는 자동 배포 사용

---

## ⚠️ 무료 플랜 제한사항

1. **슬리프 모드**
   - 15분간 요청이 없으면 서버가 잠듦
   - 첫 요청 시 깨어나는데 약 30초~1분 소요
   - 해결: Keep-alive 스크립트 사용 (선택사항)

2. **월 트래픽 제한**
   - 무료 플랜은 제한적 트래픽

3. **빌드 시간 제한**
   - 무료 플랜은 빌드 시간 제한 있음

---

## 🔧 문제 해결

### 배포 실패 시
1. Logs 탭에서 오류 확인
2. `requirements.txt` 확인
3. `render.yaml` 문법 확인

### 서버가 응답하지 않을 때
1. 첫 요청은 슬리프 모드에서 깨어나는데 시간 걸림
2. Health check 엔드포인트 확인: `/health`

---

## ✅ 체크리스트

- [ ] GitHub 저장소가 public 또는 접근 가능
- [ ] `render.yaml` 파일이 저장소에 있음
- [ ] `requirements.txt` 파일이 있음
- [ ] `server.py` 파일이 있음
- [ ] Render 계정 생성 완료
- [ ] Public Git Repository로 배포 또는 저장소 연결 완료

---

## 🎉 완료!

배포가 완료되면 전 세계 어디서나 접속 가능한 서버가 생성됩니다!

**서버 URL 예시**: `https://zoom-clone-xxxx.onrender.com`

이제 이 URL을 공유하여 화상 회의를 시작할 수 있습니다! 🚀






