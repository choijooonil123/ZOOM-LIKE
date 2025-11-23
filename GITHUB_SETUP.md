# 🚀 GitHub 업로드 빠른 가이드

## 1단계: GitHub 저장소 생성

1. [GitHub.com](https://github.com)에 로그인
2. 우측 상단 **+** 버튼 → **New repository** 클릭
3. 저장소 이름 입력 (예: `zoom-clone`)
4. 설명 추가 (선택사항)
5. **Public** 또는 **Private** 선택
6. ⚠️ **"Initialize this repository with a README" 체크 해제** (이미 README가 있음)
7. **Create repository** 클릭

## 2단계: 로컬에서 Git 설정

### PowerShell에서 실행:

```powershell
# 현재 디렉토리 확인
cd C:\python\ZOOM

# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: ZOOM 클론 애플리케이션"

# GitHub 저장소 연결 (아래 YOUR_USERNAME과 YOUR_REPO_NAME을 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 메인 브랜치로 설정
git branch -M main

# GitHub에 업로드
git push -u origin main
```

### 예시:

만약 GitHub 사용자명이 `johndoe`이고 저장소 이름이 `zoom-clone`이라면:

```powershell
git remote add origin https://github.com/johndoe/zoom-clone.git
```

## 3단계: 인증

첫 업로드 시 GitHub 인증이 필요합니다:

### 방법 1: Personal Access Token (권장)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token (classic)** 클릭
3. 권한 선택: `repo` 체크
4. 토큰 생성 후 복사
5. 비밀번호 입력 시 토큰 사용

### 방법 2: GitHub CLI

```powershell
# GitHub CLI 설치 후
gh auth login
gh repo create zoom-clone --public --source=. --remote=origin --push
```

## 4단계: 확인

GitHub 웹사이트에서 저장소를 확인하세요. 모든 파일이 업로드되었는지 확인합니다.

## 🔄 이후 업데이트 방법

코드를 수정한 후:

```powershell
git add .
git commit -m "업데이트 내용 설명"
git push
```

## 📋 체크리스트

업로드 전 확인사항:

- [ ] `.gitignore` 파일이 있음
- [ ] `README.md` 파일이 있음
- [ ] `LICENSE` 파일이 있음
- [ ] 민감한 정보(비밀번호, API 키 등)가 코드에 없음
- [ ] `requirements.txt`가 최신 상태임

## 🆘 문제 해결

### "remote origin already exists" 오류

```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### "Authentication failed" 오류

Personal Access Token을 사용하거나 GitHub CLI로 인증하세요.

### "Permission denied" 오류

저장소에 대한 쓰기 권한이 있는지 확인하세요.

## 📚 추가 리소스

- [Git 공식 문서](https://git-scm.com/doc)
- [GitHub 가이드](https://guides.github.com)
- [DEPLOY.md](DEPLOY.md) - 배포 가이드

