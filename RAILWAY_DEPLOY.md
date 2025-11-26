# Railway 배포 가이드

Railway를 사용하여 ZOOM 클론 애플리케이션을 배포하는 방법입니다.

## 1. Railway 계정 생성 및 프로젝트 생성

1. [Railway](https://railway.app)에 접속하여 계정 생성
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택 (또는 "Empty Project" 후 수동 배포)

## 2. GitHub 저장소 연결

1. GitHub 저장소를 Railway에 연결
2. 저장소 선택 후 "Deploy Now" 클릭

## 3. 데이터베이스 설정

1. Railway 대시보드에서 "New" → "Database" → "Add PostgreSQL" 선택
2. PostgreSQL 데이터베이스가 생성되면 자동으로 `DATABASE_URL` 환경 변수가 설정됩니다

## 4. 환경 변수 설정

Railway 대시보드의 "Variables" 탭에서 다음 환경 변수를 설정:

```
PORT=8000  # Railway가 자동으로 설정하므로 수정 불필요
SECRET_KEY=your-secret-key-change-this-in-production  # 강력한 랜덤 문자열 사용
```

### SECRET_KEY 생성 방법:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 5. 배포 확인

1. Railway 대시보드에서 "Settings" → "Generate Domain" 클릭
2. 생성된 도메인으로 접속하여 애플리케이션 확인
3. 예: `https://your-app-name.up.railway.app`

## 6. 자동 배포 설정

- GitHub에 푸시하면 자동으로 재배포됩니다
- Railway 대시보드에서 배포 상태를 확인할 수 있습니다

## 7. 로그 확인

Railway 대시보드의 "Deployments" 탭에서 배포 로그를 확인할 수 있습니다.

## 8. 문제 해결

### 데이터베이스 연결 오류
- PostgreSQL 데이터베이스가 생성되었는지 확인
- `DATABASE_URL` 환경 변수가 자동으로 설정되었는지 확인

### 포트 오류
- Railway는 `$PORT` 환경 변수를 자동으로 설정합니다
- `server.py`에서 `os.getenv("PORT", 8000)`을 사용하므로 문제없습니다

### 빌드 오류
- `requirements.txt`에 모든 의존성이 포함되어 있는지 확인
- Railway는 자동으로 Python 애플리케이션을 감지합니다

## 9. 추가 설정

### 정적 파일 서빙
- Railway는 정적 파일을 자동으로 서빙합니다
- `/static` 경로가 올바르게 설정되어 있습니다

### WebSocket 지원
- Railway는 WebSocket을 지원합니다
- Socket.io가 정상적으로 작동합니다

## 10. 비용

- Railway는 무료 티어를 제공합니다
- 사용량에 따라 과금될 수 있으므로 주의하세요

## 참고 사항

- Railway는 HTTPS를 자동으로 제공합니다
- 커스텀 도메인을 연결할 수 있습니다
- 환경 변수는 대시보드에서 쉽게 관리할 수 있습니다






