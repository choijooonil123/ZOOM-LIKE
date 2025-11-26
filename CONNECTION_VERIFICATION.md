# ✅ 연결 확인 가이드

## 연결이 정상적으로 작동하는지 확인하는 방법

### 1. 브라우저 콘솔에서 확인

**F12** 키를 눌러 개발자 도구를 열고 **Console** 탭을 확인하세요.

#### 정상 연결 시 나타나는 로그 순서:

```
1. 서버에 연결되었습니다: [Socket ID]
2. 기존 사용자들: {users: [...]}  (또는 "기존 사용자가 없습니다")
3. 피어 연결 생성: [targetSid], initiator: true
4. 트랙 추가: video (enabled)
5. 트랙 추가: audio (enabled)
6. Offer 생성 중: [targetSid]
7. Offer 생성 완료, 전송 중: [targetSid]
8. Offer 전송 완료: [targetSid]
9. Offer 수신: {from: "...", offer: {...}}
10. Answer 생성 중: [targetSid]
11. Answer 전송 완료: [targetSid]
12. Answer 수신: {from: "...", answer: {...}}
13. ICE Candidate 전송: [targetSid]
14. ICE Candidate 수신: {from: "...", candidate: {...}}
15. 연결 상태 변경: connecting
16. 연결 상태 변경: connected
17. ✅ 연결 성공: [targetSid]
18. ✅ 원격 스트림 수신: [targetSid]
19. ✅ 비디오 재생 시작: [username] ([targetSid])
```

### 2. 화면에서 확인

#### 연결 중
- 다른 사용자의 비디오 영역에 **👤 아이콘**과 **"연결 중..."** 표시
- 주황색 점이 깜빡임

#### 연결 완료
- **"연결됨"** (녹색 점)으로 변경
- 실제 비디오가 표시됨
- 사용자 이름이 비디오 하단에 표시됨

### 3. 네트워크 탭에서 확인

**F12** → **Network** 탭 → **WS** (WebSocket) 필터

- Socket.io 연결이 **연결됨** 상태인지 확인
- 메시지가 주고받히는지 확인

---

## 문제 진단

### 문제 1: "서버에 연결되었습니다" 로그가 없음

**원인**: Socket.io 연결 실패

**해결**:
1. 백엔드 서버가 실행 중인지 확인
2. `BACKEND_URL`이 올바른지 확인 (`static/app.js` 9번째 줄)
3. CORS 설정 확인

### 문제 2: "기존 사용자들" 로그가 비어있음

**원인**: 첫 번째 참가자이거나 이벤트가 전달되지 않음

**확인**:
- 첫 번째 사용자면 정상 (다른 사용자 참가 대기)
- 두 번째 사용자인데 비어있으면 서버 로그 확인

### 문제 3: "Offer 생성 실패" 또는 "Answer 생성 실패"

**원인**: 미디어 스트림이 없거나 WebRTC API 오류

**해결**:
1. 카메라/마이크 권한이 허용되었는지 확인
2. 브라우저 콘솔에서 권한 오류 확인
3. 다른 브라우저에서 시도

### 문제 4: "연결 상태: failed"

**원인**: NAT/방화벽 문제로 P2P 연결 실패

**해결**:
1. 같은 네트워크(WiFi)에서 테스트
2. 방화벽 설정 확인
3. TURN 서버 필요 (현재는 STUN만 사용)

### 문제 5: "원격 스트림 수신" 로그는 있지만 비디오가 안 보임

**원인**: 비디오 요소 생성 또는 재생 문제

**확인**:
1. 브라우저 콘솔에서 "비디오 재생 시작" 로그 확인
2. Elements 탭에서 `<video>` 태그 확인
3. 비디오 요소에 `srcObject`가 설정되었는지 확인

---

## 빠른 테스트 방법

### 2명 테스트

1. **브라우저 2개 열기** (또는 다른 기기 사용)

2. **첫 번째 브라우저**:
   - 방 ID: `test-01`
   - 이름: `사용자A`
   - "회의 참가" 클릭
   - 콘솔 확인: "기존 사용자가 없습니다"

3. **두 번째 브라우저**:
   - 방 ID: `test-01` (같은 방!)
   - 이름: `사용자B`
   - "회의 참가" 클릭
   - 콘솔 확인: "기존 사용자들: [{sid: '...', username: '사용자A'}]"

4. **예상 결과**:
   - 사용자A 콘솔: "새 사용자 참가: {sid: '...', username: '사용자B'}"
   - 양쪽 모두: "연결 상태 변경: connected"
   - 양쪽 모두: "원격 스트림 수신"
   - 양쪽 모두: 서로의 비디오가 보임

---

## 연결 상태 표시 의미

| 상태 | 색상 | 의미 |
|------|------|------|
| **연결 중...** | 주황색 (깜빡임) | WebRTC 연결 시도 중 |
| **연결됨** | 녹색 | 연결 성공, 비디오 표시 예정 |
| **연결 끊김** | 회색 | 연결이 끊어짐 |
| **연결 실패** | 빨간색 | 연결 실패, 재연결 시도 중 |

---

## 자동 재연결

연결이 실패하면 **3초 후 자동으로 재연결**을 시도합니다.

재연결 시도는 콘솔에 다음과 같이 표시됩니다:
```
❌ 연결 실패: [targetSid]
재연결 시도: [targetSid]
```

---

## 추가 디버깅

### WebRTC 연결 상태 확인

브라우저 콘솔에서 실행:

```javascript
// 현재 피어 연결 상태 확인
Object.keys(app.peers).forEach(sid => {
    const pc = app.peers[sid];
    console.log(`피어 ${sid}:`, {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState,
        signalingState: pc.signalingState
    });
});
```

### Socket.io 연결 확인

```javascript
// Socket 연결 상태 확인
console.log('Socket ID:', app.socket.id);
console.log('Socket 연결:', app.socket.connected);
console.log('피어 수:', Object.keys(app.peers).length);
```

---

## 결론

연결이 정상적으로 작동하면:
- ✅ 콘솔에 모든 단계의 로그가 나타남
- ✅ 화면에 연결 상태가 표시됨
- ✅ 다른 사용자의 비디오가 보임

문제가 있으면:
- ❌ 콘솔 로그를 확인하여 어느 단계에서 멈췄는지 확인
- ❌ 연결 상태 표시를 확인
- ❌ 네트워크 탭에서 WebSocket 연결 확인

