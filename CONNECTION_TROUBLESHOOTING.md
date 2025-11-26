# 🔧 WebRTC 연결 문제 해결 가이드

## 같은 방 이름으로 들어갔는데 연결이 안 될 때

### 1단계: 브라우저 콘솔 확인

**Chrome/Edge**: `F12` → `Console` 탭
**Firefox**: `F12` → `Console` 탭

#### 정상적인 로그 순서:

```
✅ 서버에 연결되었습니다: [Socket ID]
✅ 새 사용자 참가: {sid: "...", username: "..."}
✅ 기존 사용자들: {users: [...]}
✅ 피어 연결 생성: [targetSid], initiator: true
✅ Offer 생성 중: [targetSid]
✅ Offer 전송 완료: [targetSid]
✅ Offer 수신: {from: "...", offer: {...}}
✅ Answer 생성 중: [targetSid]
✅ Answer 전송 완료: [targetSid]
✅ Answer 수신: {from: "...", answer: {...}}
✅ ICE Candidate 전송: [targetSid]
✅ 연결 상태 변경: connected
✅ 원격 스트림 수신: [targetSid]
```

#### 문제가 있을 때 나타나는 로그:

- ❌ `피어 연결이 없습니다`
- ❌ `연결 실패`
- ❌ `ICE Candidate 추가 실패`
- ❌ `Offer 생성 실패`
- ❌ `Answer 생성 실패`

---

### 2단계: 서버 로그 확인

서버 터미널에서 다음 로그를 확인하세요:

```
✅ 사용자 [username] ([sid])가 방 [room_id]에 참가했습니다 (총 N명)
📤 Offer 전송: [sid1]... -> [sid2]...
📤 Answer 전송: [sid2]... -> [sid1]...
```

---

### 3단계: 일반적인 문제와 해결 방법

#### 문제 1: "서버에 연결되었습니다" 로그가 없음

**원인**: Socket.io 연결 실패

**해결 방법**:
1. 서버가 실행 중인지 확인
2. 브라우저 주소창에 올바른 서버 URL이 있는지 확인
3. 네트워크 탭에서 WebSocket 연결 확인

#### 문제 2: "기존 사용자들" 로그가 비어있음

**원인**: 첫 번째 사용자가 아직 방에 참가하지 않았거나, Socket.io 이벤트가 전달되지 않음

**해결 방법**:
1. 두 사용자가 같은 방 이름을 입력했는지 확인
2. 서버 로그에서 "사용자가 방에 참가했습니다" 확인
3. 페이지를 새로고침하고 다시 시도

#### 문제 3: "Offer 생성 실패" 또는 "Answer 생성 실패"

**원인**: 미디어 스트림이 없거나 WebRTC API 오류

**해결 방법**:
1. 카메라/마이크 권한이 허용되었는지 확인
2. 브라우저 콘솔에서 권한 오류 확인
3. 다른 브라우저에서 시도

#### 문제 4: "연결 상태: failed"

**원인**: NAT/방화벽 문제로 P2P 연결 실패

**해결 방법**:
1. 같은 네트워크(WiFi)에서 테스트
2. 방화벽 설정 확인
3. TURN 서버 설정 필요 (현재는 STUN만 사용)

#### 문제 5: "원격 스트림 수신" 로그가 없음

**원인**: WebRTC 연결은 되었지만 미디어 스트림이 전달되지 않음

**해결 방법**:
1. 연결 상태가 "connected"인지 확인
2. 비디오 요소가 DOM에 추가되었는지 확인
3. 브라우저 개발자 도구 → Elements에서 `<video>` 태그 확인

---

### 4단계: 수동 테스트 방법

#### 테스트 시나리오:

1. **브라우저 2개 열기** (또는 다른 기기 사용)

2. **첫 번째 브라우저**:
   - 방 ID: `room-01`
   - 이름: `사용자A`
   - "회의 참가" 클릭
   - 콘솔 로그 확인

3. **두 번째 브라우저**:
   - 방 ID: `room-01` (같은 방 이름!)
   - 이름: `사용자B`
   - "회의 참가" 클릭
   - 콘솔 로그 확인

4. **예상 결과**:
   - 사용자A 콘솔: "기존 사용자들: []" (첫 번째 참가자)
   - 사용자B 콘솔: "기존 사용자들: [{sid: '...', username: '사용자A'}]"
   - 사용자A 콘솔: "새 사용자 참가: {sid: '...', username: '사용자B'}"
   - 양쪽 모두: "연결 상태: connected"
   - 양쪽 모두: "원격 스트림 수신"

---

### 5단계: 디버깅 체크리스트

- [ ] 서버가 실행 중인가?
- [ ] 두 사용자가 같은 방 이름을 입력했는가?
- [ ] Socket.io 연결이 성공했는가? (콘솔에 "서버에 연결되었습니다")
- [ ] 카메라/마이크 권한이 허용되었는가?
- [ ] "user-joined" 또는 "existing-users" 이벤트가 수신되었는가?
- [ ] "Offer"와 "Answer"가 교환되었는가?
- [ ] "ICE Candidate"가 교환되었는가?
- [ ] 연결 상태가 "connected"인가?
- [ ] "원격 스트림 수신" 로그가 있는가?

---

### 6단계: 고급 디버깅

#### WebRTC 연결 상태 확인:

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

#### Socket.io 연결 확인:

```javascript
// Socket 연결 상태 확인
console.log('Socket ID:', app.socket.id);
console.log('Socket 연결:', app.socket.connected);
```

---

### 7단계: 여전히 안 되면

1. **브라우저 캐시 삭제**: `Ctrl+Shift+Delete`
2. **하드 새로고침**: `Ctrl+F5`
3. **다른 브라우저에서 시도**: Chrome, Firefox, Edge
4. **서버 재시작**: 서버를 종료하고 다시 시작
5. **방 이름 변경**: `room-01` 대신 다른 이름 시도

---

## 추가 정보

### 로그 레벨별 의미

- ✅ **성공**: 정상 작동
- ⚠️ **경고**: 문제 가능성 있음, 하지만 계속 진행
- ❌ **에러**: 문제 발생, 연결 실패 가능성

### 연결 단계별 시간

- Socket.io 연결: 즉시
- Offer/Answer 교환: 1-2초
- ICE Candidate 교환: 2-5초
- P2P 연결 완료: 3-10초

10초 이상 걸리면 문제가 있을 수 있습니다.

---

## 문의

문제가 계속되면 다음 정보를 포함해서 문의하세요:

1. 브라우저 콘솔 로그 (전체)
2. 서버 로그 (관련 부분)
3. 브라우저 종류 및 버전
4. 네트워크 환경 (같은 WiFi인지, 다른 네트워크인지)

