# 🚀 GitHub 배포 가이드

이 프로젝트를 GitHub에 업로드하고 배포하는 방법입니다.

## 📋 GitHub에 업로드하기

### 1. GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단의 **+** 버튼 클릭 → **New repository** 선택
3. 저장소 이름 입력 (예: `zoom-clone`)
4. **Public** 또는 **Private** 선택
5. **Initialize this repository with a README** 체크 해제 (이미 README가 있음)
6. **Create repository** 클릭

### 2. 로컬에서 Git 초기화 및 업로드

터미널에서 다음 명령어를 실행하세요:

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: ZOOM 클론 애플리케이션"

# GitHub 저장소 연결 (YOUR_USERNAME과 YOUR_REPO_NAME을 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 메인 브랜치로 이름 변경 (필요시)
git branch -M main

# GitHub에 푸시
git push -u origin main
```

### 3. GitHub CLI 사용 (대안)

```bash
# GitHub CLI 설치 후
gh repo create zoom-clone --public --source=. --remote=origin --push
```

## 🌐 무료 호스팅 옵션

### 옵션 1: Render.com

1. [Render.com](https://render.com) 가입
2. **New +** → **Web Service** 선택
3. GitHub 저장소 연결
4. 설정:
   - **Name**: zoom-clone
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python server.py`
   - **Port**: 8000

### 옵션 2: Railway

1. [Railway.app](https://railway.app) 가입
2. **New Project** → **Deploy from GitHub repo** 선택
3. 저장소 선택
4. 자동으로 감지되어 배포됨

### 옵션 3: Heroku

1. [Heroku](https://heroku.com) 가입
2. Heroku CLI 설치
3. 다음 명령어 실행:

```bash
heroku create zoom-clone-app
git push heroku main
```

### 옵션 4: PythonAnywhere

1. [PythonAnywhere](https://www.pythonanywhere.com) 가입
2. **Web** 탭에서 새 웹앱 생성
3. GitHub에서 코드 가져오기
4. WSGI 파일 설정

## 📝 배포 시 주의사항

### 환경 변수 설정

프로덕션 환경에서는 환경 변수를 사용하세요:

```python
import os

PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
```

### Procfile 생성 (Heroku용)

```
web: python server.py
```

### requirements.txt 확인

모든 의존성이 포함되어 있는지 확인하세요.

## 🔒 보안 고려사항

프로덕션 배포 전에:

- [ ] CORS 설정 제한
- [ ] 환경 변수로 민감한 정보 관리
- [ ] HTTPS 사용
- [ ] Rate limiting 추가
- [ ] 인증 시스템 구현

## 📚 추가 리소스

- [FastAPI 배포 가이드](https://fastapi.tiangolo.com/deployment/)
- [WebRTC 프로덕션 가이드](https://webrtc.org/getting-started/production-checklist)

