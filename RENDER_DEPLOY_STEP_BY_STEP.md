# 🚀 Render 배포 단계별 가이드

## ✅ 준비사항 체크리스트

- [ ] GitHub 계정 있음
- [ ] Render 계정 있음 (없으면 가입 필요)
- [ ] 코드가 GitHub에 푸시됨

---

## 📝 1단계: GitHub에 코드 푸시

### 1-1. Git 초기화 (아직 안 했다면)

```bash
cd C:\python\ZOOM
git init
git add .
git commit -m "Initial commit - Zoom Clone"
```

### 1-2. GitHub 저장소 생성

1. [GitHub.com](https://github.com) 접속
2. 우측 상단 **"+" → "New repository"** 클릭
3. 저장소 이름: `zoom-clone` (또는 원하는 이름)
4. **Public** 선택 (무료 플랜)
5. **"Create repository"** 클릭

### 1-3. 로컬 코드를 GitHub에 푸시

GitHub에서 생성된 저장소 페이지에서 나오는 명령어를 사용하거나:

```bash
git remote add origin https://github.com/본인아이디/zoom-clone.git
git branch -M main
git push -u origin main
```

> **참고**: GitHub 아이디와 저장소 이름을 실제 값으로 바꿔주세요!

---

## 🌐 2단계: Render 계정 생성 및 로그인

1. [render.com](https://render.com) 접속
2. **"Get Started for Free"** 또는 **"Sign Up"** 클릭
3. **"Continue with GitHub"** 클릭 (권장) 또는 이메일로 가입
4. GitHub 권한 허용

---

## 🔧 3단계: Render에서 새 Web Service 생성

### 3-1. 새 서비스 시작

1. Render 대시보드에서 **"New +"** 버튼 클릭 (우측 상단)
2. **"Web Service"** 선택

### 3-2. GitHub 저장소 연결

1. **"Connect account"** 또는 **"Connect a repository"** 클릭
2. GitHub 저장소 목록에서 **`zoom-clone`** (또는 만든 저장소 이름) 선택
3. **"Connect"** 클릭

### 3-3. 서비스 설정

**중요**: `render.yaml` 파일이 있으면 Render가 자동으로 설정을 읽어옵니다!

하지만 수동으로 확인/수정하려면:

- **Name**: `zoom-clone` (원하는 이름, URL에 사용됨)
- **Region**: `Singapore` 또는 `Oregon` (가까운 곳 선택)
- **Branch**: `main`
- **Root Directory**: (비워두기 - 루트에서 실행)
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  uvicorn server:socket_app --host 0.0.0.0 --port $PORT
  ```
- **Plan**: `Free` (무료 플랜)

> **참고**: `render.yaml`이 있으면 위 설정들이 자동으로 채워집니다!

---

## 🔐 4단계: 환경 변수 설정

### 4-1. 환경 변수 추가

서비스 생성 후 또는 Settings에서:

1. **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **"Environment"** 선택
3. **"Add Environment Variable"** 클릭

### 4-2. 필수 환경 변수

다음 환경 변수를 추가하세요:

| Key | Value | 설명 |
|-----|-------|------|
| `SECRET_KEY` | `your-super-secret-key-change-this-12345` | JWT 토큰 암호화용 (복잡한 랜덤 문자열 권장) |
| `PORT` | (자동 설정됨) | Render가 자동으로 설정하므로 건드리지 마세요 |

### 4-3. 선택적 환경 변수

PostgreSQL 데이터베이스를 사용하려면:

1. Render 대시보드에서 **"New +" → "PostgreSQL"** 클릭
2. 이름: `zoom-clone-db`
3. Plan: `Free` 선택
4. **"Create Database"** 클릭
5. 생성된 데이터베이스의 **"Connections"** 탭에서 **"Internal Database URL"** 복사
6. Web Service의 환경 변수에 추가:
   - Key: `DATABASE_URL`
   - Value: (복사한 URL 붙여넣기)

> **참고**: PostgreSQL을 안 쓰면 SQLite 파일을 사용합니다 (무료 플랜에서도 작동)

---

## 🚀 5단계: 배포 시작

1. 모든 설정이 완료되면 **"Create Web Service"** 또는 **"Save Changes"** 클릭
2. 배포가 자동으로 시작됩니다
3. **"Logs"** 탭에서 배포 진행 상황 확인

### 배포 시간
- 첫 배포: 약 **3-5분** 소요
- 이후 업데이트: 약 **1-3분** 소요

---

## ✅ 6단계: 배포 완료 확인

### 6-1. URL 확인

배포가 완료되면 Render가 자동으로 URL을 생성합니다:

```
https://zoom-clone-xxxx.onrender.com
```

(실제 URL은 Render 대시보드에서 확인)

### 6-2. 접속 테스트

1. 브라우저에서 생성된 URL 접속
2. 로그인 화면이 보이면 성공! ✅
3. 회원가입/게스트 모드 테스트

### 6-3. Health Check

서버가 정상 작동하는지 확인:

```
https://your-app.onrender.com/health
```

응답 예시:
```json
{"status":"ok","timestamp":"2025-01-23T12:34:56"}
```

---

## ⚠️ 주의사항

### 무료 플랜 제한사항

1. **슬리프 모드 (Sleep Mode)**
   - 15분간 요청이 없으면 서버가 잠듦
   - 첫 요청 시 깨어나는데 **30초~1분** 소요
   - 해결: 무료 플랜에서는 어쩔 수 없음 (유료 플랜 사용 시 해결)

2. **월 트래픽 제한**
   - 무료 플랜은 제한적
   - 일반적인 테스트 용도로는 충분

### HTTPS 자동 제공

- Render는 자동으로 HTTPS를 제공합니다 ✅
- 카메라/마이크 접근에 HTTPS가 필요하므로 필수입니다
- 별도 SSL 인증서 설정 불필요

---

## 🔄 코드 업데이트 배포

코드를 수정한 후:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

Render가 자동으로 변경사항을 감지하고 재배포합니다!

---

## 🆘 문제 해결

### 배포 실패 시

1. **Logs 탭 확인**
   - 빨간색 에러 메시지 확인
   - 가장 아래쪽 에러부터 확인

2. **일반적인 오류들**

   - **ModuleNotFoundError**: `requirements.txt`에 누락된 패키지 추가
   - **Port already in use**: Start Command 확인 (`$PORT` 사용)
   - **Database connection error**: `DATABASE_URL` 확인

### 서버가 응답하지 않을 때

1. **슬리프 모드 확인**
   - 첫 요청은 30초~1분 기다려보기
   - Health check 엔드포인트로 확인

2. **Logs 확인**
   - 서버가 실행 중인지 확인
   - 에러 메시지 확인

---

## 📊 모니터링

Render 대시보드에서:

- **Logs**: 실시간 로그 확인
- **Metrics**: CPU, 메모리 사용량
- **Events**: 배포 이력

---

## 🎉 완료!

배포가 완료되면 **전 세계 어디서나 접속 가능한 URL**이 생성됩니다!

### 사용 방법

1. **PC에서**: `https://your-app.onrender.com` 접속
2. **휴대폰에서**: 같은 URL 접속 (4G/5G/Wi-Fi 모두 가능)
3. **다른 사람에게**: URL 공유하면 됩니다!

### 예시

```
https://zoom-clone-abc123.onrender.com
```

이 URL을 상대방에게 공유하면, 어디서든 접속해서 회의에 참가할 수 있습니다! 🚀

---

## 📝 체크리스트

배포 전 최종 확인:

- [ ] `render.yaml` 파일이 있음
- [ ] `requirements.txt`에 모든 의존성이 있음
- [ ] `server.py`가 `$PORT` 환경 변수를 사용함
- [ ] GitHub에 코드가 푸시됨
- [ ] Render 계정이 생성됨
- [ ] GitHub 저장소가 Render에 연결됨
- [ ] 환경 변수 `SECRET_KEY` 설정됨
- [ ] (선택) `DATABASE_URL` 설정됨 (PostgreSQL 사용 시)

---

## 💡 팁

1. **무료 플랜 슬리프 모드 해결**
   - [UptimeRobot](https://uptimerobot.com) 같은 서비스로 5분마다 ping 보내기
   - 또는 유료 플랜 사용 ($7/월)

2. **커스텀 도메인**
   - Render는 무료로 커스텀 도메인 지원
   - Settings → Custom Domains에서 설정

3. **환경 변수 보안**
   - `SECRET_KEY`는 절대 GitHub에 올리지 마세요!
   - `.env` 파일은 `.gitignore`에 포함되어 있음

---

**문제가 있으면 Render 대시보드의 Logs 탭을 확인하고, 에러 메시지를 알려주세요!** 🆘

