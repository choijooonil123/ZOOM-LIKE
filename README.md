# 🎥 ZOOM 클론 - 화상 회의 애플리케이션

WebRTC와 Socket.io를 사용한 실시간 화상 회의 애플리케이션입니다.

## ✨ 주요 기능

- 🔐 사용자 인증 (회원가입/로그인)
- 📹 실시간 화상 통화 (WebRTC)
- 🎤 오디오/비디오 제어
- 🖥️ 화면 공유
- 💬 실시간 채팅
- ✏️ 화이트보드
- 🎬 회의 녹화
- 🖼️ 가상 배경
- 📱 모바일 최적화

## 🚀 빠른 시작

### 필수 요구사항

- Python 3.8 이상
- pip (Python 패키지 관리자)

### 설치 방법

1. **저장소 클론**
```bash
git clone <repository-url>
cd ZOOM
```

2. **가상 환경 생성 및 활성화 (권장)**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. **의존성 설치**
```bash
pip install -r requirements.txt
```

4. **환경 변수 설정**

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# JWT Secret Key (프로덕션에서는 반드시 변경하세요!)
SECRET_KEY=your-secret-key-change-this-in-production-use-a-random-string

# 데이터베이스 URL (로컬 개발용)
# PostgreSQL 사용 시: postgresql://user:password@localhost:5432/dbname
# SQLite 사용 시: sqlite:///./zoom_clone.db
DATABASE_URL=sqlite:///./zoom_clone.db

# 서버 포트
PORT=8000
```

**중요**: `SECRET_KEY`는 프로덕션 환경에서 반드시 강력한 랜덤 문자열로 변경하세요!

5. **서버 실행**
```bash
python server.py
```

6. **브라우저에서 접속**
```
http://localhost:8000
```

## 📖 사용 방법

### 1. 회원가입/로그인

- 첫 접속 시 로그인 화면이 표시됩니다
- 새 계정을 만들거나 기존 계정으로 로그인하세요
- 게스트 모드로도 사용할 수 있습니다

### 2. 회의실 참가

- 로비 화면에서 회의실 ID를 입력하거나
- "새 회의실 생성" 버튼을 클릭하여 새 회의실을 만드세요

### 3. 회의 기능 사용

- **마이크/비디오**: 컨트롤 바에서 토글 버튼 클릭
- **화면 공유**: 화면 공유 버튼 클릭
- **채팅**: 채팅 버튼 클릭하여 사이드바 열기
- **화이트보드**: 화이트보드 버튼 클릭
- **녹화**: 녹화 버튼 클릭 (로컬에 저장됨)

## 🛠️ 기술 스택

### 백엔드
- **FastAPI**: 고성능 웹 프레임워크
- **Socket.io**: 실시간 양방향 통신
- **SQLAlchemy**: ORM
- **JWT**: 인증 토큰
- **bcrypt**: 비밀번호 해싱

### 프론트엔드
- **Vanilla JavaScript**: 순수 JavaScript
- **WebRTC**: P2P 화상 통신
- **TensorFlow.js**: 가상 배경 (BodyPix)

### 데이터베이스
- **SQLite** (로컬 개발)
- **PostgreSQL** (프로덕션, Railway 등)

## 📁 프로젝트 구조

```
ZOOM/
├── server.py              # FastAPI 백엔드 서버
├── database.py            # 데이터베이스 모델 및 설정
├── auth.py                # 인증 유틸리티
├── requirements.txt       # Python 의존성
├── static/                # 정적 파일
│   ├── index.html        # 메인 HTML
│   ├── app.js            # 클라이언트 JavaScript
│   ├── style.css         # 스타일시트
│   ├── manifest.json     # PWA 매니페스트
│   └── sw.js             # Service Worker
├── uploads/               # 업로드된 파일
└── zoom_clone.db         # SQLite 데이터베이스 (자동 생성)
```

## 🔒 보안 고려사항

1. **SECRET_KEY**: 프로덕션 환경에서는 반드시 강력한 랜덤 문자열로 설정
2. **HTTPS**: 프로덕션에서는 HTTPS 사용 권장
3. **CORS**: 필요시 `server.py`에서 CORS 설정 조정
4. **비밀번호**: 최소 6자 이상 권장

## 🌐 배포

### Railway 배포
- `RAILWAY_DEPLOY.md` 참고

### Render 배포
- `RENDER_SETUP.md` 참고

## 🐛 문제 해결

### 카메라/마이크 접근 권한 오류
- 브라우저 설정에서 카메라/마이크 권한을 허용하세요

### WebRTC 연결 실패
- 방화벽 설정 확인
- STUN 서버 설정 확인 (`app.js`의 `iceServers`)

### 데이터베이스 오류
- SQLite 파일 권한 확인
- PostgreSQL 연결 정보 확인

## 📝 API 엔드포인트

### 인증
- `POST /api/register` - 회원가입
- `POST /api/login` - 로그인
- `GET /api/me` - 현재 사용자 정보 (인증 필요)

### 기타
- `GET /health` - 헬스 체크
- `GET /` - 메인 페이지

## 🤝 기여

이슈나 풀 리퀘스트를 환영합니다!

## 📄 라이선스

MIT License

## 🔄 업데이트 내역

### v1.0.0 (최신)
- ✅ 사용자 인증 시스템 추가
- ✅ 회원가입/로그인 기능
- ✅ JWT 토큰 기반 인증
- ✅ 게스트 모드 지원

---

**참고**: 이 프로젝트는 학습 목적으로 제작되었습니다. 프로덕션 환경에서 사용하기 전에 보안 및 성능 최적화를 수행하세요.

