# 🎥 ZOOM 클론 애플리케이션

ZOOM과 유사한 기능을 가진 실시간 화상 회의 애플리케이션입니다.

## ✨ 주요 기능

- 🎥 **실시간 화상/음성 통화**: WebRTC를 사용한 P2P 통신
- 💬 **실시간 채팅**: Socket.io를 사용한 텍스트 메시징
- 🖥️ **화면 공유**: 데스크톱 화면 공유 기능
- 👥 **다중 사용자 지원**: 여러 사용자가 동시에 참가 가능
- 🎛️ **미디어 제어**: 비디오/오디오 켜기/끄기
- 🎨 **모던 UI**: 반응형 디자인의 아름다운 사용자 인터페이스
- 🔐 **회의실 관리**: 회의실 ID 기반 접근 제어

## 🚀 시작하기

### 필수 요구사항

- Python 3.8 이상
- Node.js (선택사항, package.json용)
- 최신 웹 브라우저 (Chrome, Firefox, Edge 등)

### 설치 방법

1. **의존성 설치**

```bash
pip install -r requirements.txt
```

2. **서버 실행**

```bash
python server.py
```

서버가 `http://localhost:8000`에서 실행됩니다.

3. **브라우저에서 접속**

웹 브라우저에서 `http://localhost:8000`을 열어주세요.

## 📖 사용 방법

### 회의 참가

1. 이름을 입력하세요
2. 회의실 ID를 입력하거나 "새 회의실 생성" 버튼을 클릭하세요
3. "회의 참가" 버튼을 클릭하세요
4. 카메라/마이크 접근 권한을 허용하세요

### 회의 중 기능

- **🎤 마이크**: 마이크 켜기/끄기
- **📹 비디오**: 카메라 켜기/끄기
- **🖥️ 화면 공유**: 데스크톱 화면 공유 시작/중지
- **💬 채팅**: 텍스트 메시지 전송
- **📞 나가기**: 회의에서 나가기

### 다른 사용자 초대

회의실 ID를 다른 사용자에게 공유하면 같은 방에 참가할 수 있습니다.

## 🏗️ 기술 스택

### 백엔드
- **FastAPI**: 고성능 Python 웹 프레임워크
- **Socket.io**: 실시간 양방향 통신
- **Uvicorn**: ASGI 서버

### 프론트엔드
- **HTML5/CSS3**: 모던 웹 표준
- **JavaScript (ES6+)**: 클라이언트 로직
- **WebRTC**: P2P 비디오/오디오 통신
- **Socket.io Client**: 실시간 통신 클라이언트

## 📁 프로젝트 구조

```
ZOOM/
├── server.py              # FastAPI 백엔드 서버
├── requirements.txt       # Python 의존성
├── package.json          # Node.js 패키지 정보
├── README.md             # 프로젝트 문서
└── static/               # 정적 파일
    ├── index.html        # 메인 HTML
    ├── style.css         # 스타일시트
    └── app.js            # 클라이언트 JavaScript
```

## 🔧 설정

### 포트 변경

`server.py` 파일의 마지막 줄에서 포트를 변경할 수 있습니다:

```python
uvicorn.run(socket_app, host="0.0.0.0", port=8000, log_level="info")
```

### STUN 서버 변경

`static/app.js` 파일의 `createPeerConnection` 메서드에서 STUN 서버를 변경할 수 있습니다.

## ⚠️ 제한사항

- 현재는 로컬 네트워크 또는 같은 컴퓨터에서만 테스트되었습니다
- 프로덕션 환경에서는 TURN 서버가 필요할 수 있습니다 (NAT 뒤의 사용자 지원)
- HTTPS가 필요할 수 있습니다 (일부 브라우저의 WebRTC 요구사항)

## 🛠️ 향후 개선 사항

- [ ] 사용자 인증 시스템
- [ ] 회의 녹화 기능
- [ ] 가상 배경
- [ ] 화면 녹화
- [ ] 파일 공유
- [ ] 화이트보드
- [ ] 반응형 레이아웃 개선
- [ ] 모바일 지원
- [ ] 다국어 지원

## 📤 GitHub에 업로드하기

### 빠른 시작

```bash
# Git 초기화
git init

# 파일 추가
git add .

# 커밋
git commit -m "Initial commit: ZOOM 클론 애플리케이션"

# GitHub 저장소 연결 (YOUR_USERNAME과 YOUR_REPO_NAME 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 업로드
git branch -M main
git push -u origin main
```

자세한 배포 가이드는 [DEPLOY.md](DEPLOY.md)를 참고하세요.

## 🌐 배포 옵션

- **Render.com**: 무료 Python 호스팅
- **Railway**: 간편한 GitHub 연동 배포
- **Heroku**: 클라우드 플랫폼
- **PythonAnywhere**: Python 전용 호스팅

자세한 내용은 [DEPLOY.md](DEPLOY.md)를 확인하세요.

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 문의

문제가 발생하거나 제안사항이 있으시면 이슈를 생성해주세요.

---

**참고**: 이 프로젝트는 교육 목적으로 제작되었습니다. 프로덕션 환경에서 사용하기 전에 보안 및 성능 최적화가 필요합니다.

