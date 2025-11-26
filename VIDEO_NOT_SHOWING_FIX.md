# 🔧 다른 사람 비디오가 안 보일 때 해결 방법

## 🚨 문제: 다른 사람의 비디오가 자동으로 보이지 않음

### 즉시 확인 사항

#### 1. 브라우저 콘솔 확인 (F12)

**정상 연결 시 나타나는 로그:**
```
✅ 서버에 연결되었습니다: [Socket ID]
✅ 기존 사용자들: {users: [...]}
✅ 피어 연결 생성: [targetSid]
✅ 트랙 추가 완료: video (enabled)
✅ 트랙 추가 완료: audio (enabled)
✅ Offer 생성 완료
✅ Answer 수신
✅ 연결 상태 변경: connected
✅ 원격 스트림 수신: [targetSid]
✅ 비디오 메타데이터 로드
✅ 비디오 재생 시작
```

**문제가 있을 때:**
- ❌ "원격 스트림 수신" 로그가 없음
- ❌ "연결 상태: failed"
- ❌ "비디오 재생 실패"

---

## 🔍 단계별 진단

### 단계 1: Socket.io 연결 확인

**확인 사항:**
- 콘솔에 "서버에 연결되었습니다" 로그가 있는가?
- 네트워크 탭에서 WebSocket 연결이 있는가?

**문제가 있으면:**
- 백엔드 서버가 실행 중인지 확인
- `BACKEND_URL`이 올바른지 확인

---

### 단계 2: 사용자 참가 확인

**확인 사항:**
- "기존 사용자들" 로그에 다른 사용자가 있는가?
- "새 사용자 참가" 로그가 나타나는가?

**문제가 있으면:**
- 두 사용자가 **정확히 같은 방 이름**을 입력했는지 확인
- 서버 로그에서 사용자 참가 확인

---

### 단계 3: WebRTC 연결 확인

**확인 사항:**
- "피어 연결 생성" 로그가 있는가?
- "트랙 추가 완료" 로그가 있는가?
- "Offer 생성 완료" 로그가 있는가?
- "Answer 수신" 로그가 있는가?

**문제가 있으면:**
- 카메라/마이크 권한이 허용되었는지 확인
- 브라우저 콘솔에서 권한 오류 확인

---

### 단계 4: 원격 스트림 수신 확인

**확인 사항:**
- "원격 스트림 수신" 로그가 있는가?
- "스트림 정보" 로그에 트랙이 있는가?
- "비디오 메타데이터 로드" 로그가 있는가?

**문제가 있으면:**
- 연결은 되었지만 스트림이 전달되지 않는 경우
- 네트워크 문제일 수 있음

---

### 단계 5: 비디오 재생 확인

**확인 사항:**
- "비디오 재생 시작" 로그가 있는가?
- Elements 탭에서 `<video>` 태그가 있는가?
- 비디오 요소에 `srcObject`가 설정되었는가?

**문제가 있으면:**
- 브라우저가 비디오 재생을 차단했을 수 있음
- 자동 재생 정책 문제일 수 있음

---

## 🛠️ 해결 방법

### 방법 1: 브라우저 콘솔에서 수동 재생

브라우저 콘솔(F12)에서 실행:

```javascript
// 모든 비디오 요소 찾기
const videos = document.querySelectorAll('video');
videos.forEach((video, index) => {
    console.log(`비디오 ${index}:`, {
        paused: video.paused,
        srcObject: video.srcObject,
        readyState: video.readyState
    });
    
    // 재생되지 않은 비디오 재생 시도
    if (video.paused && video.srcObject) {
        video.play().then(() => {
            console.log(`비디오 ${index} 재생 성공`);
        }).catch(err => {
            console.error(`비디오 ${index} 재생 실패:`, err);
        });
    }
});
```

### 방법 2: 연결 상태 확인

```javascript
// 피어 연결 상태 확인
Object.keys(app.peers).forEach(sid => {
    const pc = app.peers[sid];
    console.log(`피어 ${sid}:`, {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        receivers: pc.getReceivers().length,
        senders: pc.getSenders().length
    });
    
    // Receivers 확인
    pc.getReceivers().forEach((receiver, index) => {
        if (receiver.track) {
            console.log(`Receiver ${index}:`, {
                kind: receiver.track.kind,
                enabled: receiver.track.enabled,
                readyState: receiver.track.readyState
            });
        }
    });
});
```

### 방법 3: 스트림 확인

```javascript
// 모든 비디오 요소의 스트림 확인
document.querySelectorAll('video').forEach((video, index) => {
    if (video.srcObject) {
        const stream = video.srcObject;
        console.log(`비디오 ${index} 스트림:`, {
            id: stream.id,
            active: stream.active,
            tracks: stream.getTracks().map(t => ({
                kind: t.kind,
                enabled: t.enabled,
                readyState: t.readyState
            }))
        });
    }
});
```

---

## 🐛 일반적인 문제와 해결

### 문제 1: "원격 스트림 수신" 로그는 있지만 비디오가 안 보임

**원인**: 비디오 재생 실패

**해결**:
1. 브라우저 콘솔에서 "비디오 재생 실패" 로그 확인
2. 자동 재생 정책 문제일 수 있음
3. 수동으로 재생 시도 (위의 방법 1 참고)

### 문제 2: "연결 상태: connected"지만 비디오가 안 보임

**원인**: 스트림이 전달되지 않음

**해결**:
1. Receivers 확인 (위의 방법 2 참고)
2. 스트림 확인 (위의 방법 3 참고)
3. 네트워크 문제일 수 있음

### 문제 3: "연결 상태: failed"

**원인**: P2P 연결 실패

**해결**:
1. 같은 네트워크(WiFi)에서 테스트
2. 방화벽 설정 확인
3. TURN 서버 필요 (현재는 STUN만 사용)

### 문제 4: 연결은 되지만 비디오가 검은 화면

**원인**: 스트림은 있지만 비디오 트랙이 비활성화됨

**해결**:
1. 상대방의 카메라가 켜져 있는지 확인
2. 상대방의 비디오 토글 버튼 확인
3. 브라우저 콘솔에서 트랙 상태 확인

---

## ✅ 빠른 체크리스트

다른 사람의 비디오를 보기 위한 체크리스트:

- [ ] 두 사용자가 **같은 방 이름**을 입력했는가?
- [ ] 브라우저 콘솔에 **"서버에 연결되었습니다"** 로그가 있는가?
- [ ] 브라우저 콘솔에 **"기존 사용자들"** 또는 **"새 사용자 참가"** 로그가 있는가?
- [ ] 브라우저 콘솔에 **"연결 상태 변경: connected"** 로그가 있는가?
- [ ] 브라우저 콘솔에 **"원격 스트림 수신"** 로그가 있는가?
- [ ] 브라우저 콘솔에 **"비디오 재생 시작"** 로그가 있는가?
- [ ] 화면에 **"연결됨"** (녹색 점) 표시가 있는가?
- [ ] Elements 탭에서 **`<video>` 태그**가 있는가?
- [ ] 비디오 요소에 **`srcObject`**가 설정되었는가?

---

## 🔧 추가 디버깅

### 모든 연결 정보 출력

브라우저 콘솔에서 실행:

```javascript
// 전체 연결 상태 확인
console.log('=== 연결 상태 확인 ===');
console.log('Socket ID:', app.socket.id);
console.log('Socket 연결:', app.socket.connected);
console.log('피어 수:', Object.keys(app.peers).length);
console.log('로컬 스트림:', app.localStream ? '있음' : '없음');

Object.keys(app.peers).forEach(sid => {
    const pc = app.peers[sid];
    console.log(`\n피어 ${sid}:`);
    console.log('  연결 상태:', pc.connectionState);
    console.log('  ICE 연결 상태:', pc.iceConnectionState);
    console.log('  Receivers:', pc.getReceivers().length);
    console.log('  Senders:', pc.getSenders().length);
    
    pc.getReceivers().forEach((receiver, i) => {
        if (receiver.track) {
            console.log(`  Receiver ${i}:`, receiver.track.kind, receiver.track.readyState);
        }
    });
});

console.log('\n=== 비디오 요소 확인 ===');
document.querySelectorAll('video').forEach((video, i) => {
    console.log(`비디오 ${i}:`, {
        id: video.id || '없음',
        paused: video.paused,
        readyState: video.readyState,
        hasSrcObject: !!video.srcObject,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
    });
});
```

---

## 📞 문제가 계속되면

다음 정보를 확인하세요:

1. **브라우저 콘솔 로그** (전체)
2. **네트워크 탭** (WebSocket 메시지)
3. **Elements 탭** (비디오 요소 확인)
4. **브라우저 종류 및 버전**
5. **네트워크 환경** (같은 WiFi인지)

이 정보를 가지고 있으면 문제를 더 정확히 진단할 수 있습니다.

