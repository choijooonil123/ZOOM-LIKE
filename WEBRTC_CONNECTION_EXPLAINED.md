# 🔗 WebRTC 연결 과정 설명

## 📡 송신자와 수신자가 연결되는 방법

이 프로젝트는 **WebRTC (Web Real-Time Communication)**를 사용하여 P2P(Peer-to-Peer) 화상 통화를 구현합니다.

---

## 🔄 전체 연결 과정

### 1단계: 방 참가 및 사용자 알림

```
사용자 A (송신자)                    서버 (Socket.io)              사용자 B (수신자)
     |                                    |                              |
     |--- join_room -------------------->|                              |
     |                                    |--- user-joined ------------>|
     |                                    |                              |
     |<-- existing-users ----------------|                              |
```

1. **사용자 A가 방에 참가**
   - `join_room` 이벤트 전송
   - 서버가 방에 사용자 추가

2. **서버가 기존 사용자들에게 알림**
   - `user-joined` 이벤트로 사용자 B에게 알림
   - 사용자 B가 새 사용자(A)의 존재를 인지

3. **서버가 새 사용자에게 기존 사용자 목록 전송**
   - `existing-users` 이벤트로 사용자 A에게 사용자 B 정보 전송

---

### 2단계: WebRTC 연결 시작 (Offer/Answer 교환)

#### 2-1. Offer 생성 및 전송 (송신자 → 수신자)

```
사용자 A (송신자)                    서버 (Socket.io)              사용자 B (수신자)
     |                                    |                              |
     |--- createPeerConnection(A->B)     |                              |
     |--- createOffer()                  |                              |
     |--- offer ------------------------->|                              |
     |                                    |--- offer ------------------>|
     |                                    |                              |
```

**코드 위치**: `static/app.js`의 `createPeerConnection()` 함수

```javascript
// 사용자 A가 사용자 B와 연결 시작
if (isInitiator) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    this.socket.emit('offer', {
        target: targetSid,  // 사용자 B의 Socket ID
        offer: offer
    });
}
```

**과정**:
1. 사용자 A가 `RTCPeerConnection` 생성
2. 로컬 스트림(카메라/마이크)을 연결에 추가
3. `createOffer()` 호출 → SDP(Session Description Protocol) 생성
4. Offer를 Socket.io를 통해 사용자 B에게 전송

#### 2-2. Answer 생성 및 전송 (수신자 → 송신자)

```
사용자 A (송신자)                    서버 (Socket.io)              사용자 B (수신자)
     |                                    |                              |
     |                                    |<-- offer --------------------|
     |                                    |                              |
     |                                    |--- setRemoteDescription()    |
     |                                    |--- createAnswer()            |
     |                                    |--- answer ------------------>|
     |<-- answer -------------------------|                              |
     |--- setRemoteDescription()         |                              |
```

**코드 위치**: `static/app.js`의 `handleOffer()` 함수

```javascript
// 사용자 B가 Offer를 받고 Answer 생성
async handleOffer(data) {
    const peerConnection = this.peers[data.from];
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    this.socket.emit('answer', {
        target: data.from,  // 사용자 A의 Socket ID
        answer: answer
    });
}
```

**과정**:
1. 사용자 B가 Offer 수신
2. `setRemoteDescription(offer)` → 상대방의 미디어 정보 설정
3. `createAnswer()` 호출 → Answer SDP 생성
4. Answer를 Socket.io를 통해 사용자 A에게 전송
5. 사용자 A가 `setRemoteDescription(answer)` → 연결 정보 완성

---

### 3단계: ICE Candidate 교환 (네트워크 경로 찾기)

```
사용자 A (송신자)                    서버 (Socket.io)              사용자 B (수신자)
     |                                    |                              |
     |--- ICE Candidate 1 --------------->|                              |
     |                                    |--- ice-candidate ----------->|
     |                                    |                              |
     |<-- ICE Candidate 1 ----------------|                              |
     |                                    |<-- ice-candidate ------------|
     |                                    |                              |
     |--- ICE Candidate 2 --------------->|                              |
     |                                    |--- ice-candidate ----------->|
     |                                    |                              |
```

**코드 위치**: `static/app.js`의 `onicecandidate` 이벤트

```javascript
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        this.socket.emit('ice_candidate', {
            target: targetSid,
            candidate: event.candidate
        });
    }
};
```

**과정**:
1. 각 사용자의 브라우저가 가능한 네트워크 경로(ICE Candidate)를 찾음
2. STUN 서버를 통해 공인 IP 주소 확인
3. ICE Candidate를 Socket.io를 통해 상대방에게 전송
4. 양쪽이 서로의 ICE Candidate를 교환
5. 최적의 경로를 찾아 P2P 연결 수립

---

### 4단계: 미디어 스트림 전송 (P2P 연결 완료)

```
사용자 A (송신자)  <========== P2P 연결 ==========>  사용자 B (수신자)
     |                                                      |
     |--- 비디오/오디오 스트림 -------------------------->|
     |                                                      |
     |<---------------- 비디오/오디오 스트림 --------------|
```

**코드 위치**: `static/app.js`의 `ontrack` 이벤트

```javascript
peerConnection.ontrack = (event) => {
    console.log('원격 스트림 수신:', targetSid);
    const remoteStream = event.streams[0];
    this.addVideoElement(targetSid, remoteStream, 'User', false);
};
```

**과정**:
1. WebRTC 연결이 완료되면 `ontrack` 이벤트 발생
2. 상대방의 미디어 스트림(비디오/오디오) 수신
3. 비디오 요소에 스트림 연결하여 화면에 표시

---

## 🔑 핵심 개념

### 1. Socket.io의 역할 (시그널링 서버)

- **Offer/Answer 교환**: WebRTC 연결 정보 전달
- **ICE Candidate 교환**: 네트워크 경로 정보 전달
- **사용자 알림**: 누가 방에 참가했는지 알림

**중요**: Socket.io는 **시그널링만** 담당하고, 실제 미디어 데이터는 전송하지 않습니다!

### 2. WebRTC의 역할 (P2P 연결)

- **실제 미디어 전송**: 비디오/오디오 스트림을 직접 전송
- **P2P 연결**: 서버를 거치지 않고 사용자 간 직접 연결

### 3. STUN 서버의 역할

- **공인 IP 확인**: NAT 뒤에 있는 사용자의 공인 IP 주소 확인
- **연결 가능성 확인**: 두 사용자가 직접 연결 가능한지 확인

---

## 📊 연결 상태 다이어그램

```
┌─────────────┐                    ┌─────────────┐
│  사용자 A   │                    │  사용자 B   │
│  (송신자)   │                    │  (수신자)   │
└──────┬──────┘                    └──────┬──────┘
       │                                   │
       │ 1. join_room                      │
       ├──────────────────────────────────>│
       │                                   │
       │ 2. user-joined                    │
       │<──────────────────────────────────┤
       │                                   │
       │ 3. createPeerConnection           │
       │    createOffer()                  │
       │                                   │
       │ 4. offer                           │
       ├──────────────────────────────────>│
       │                                   │
       │ 5. setRemoteDescription(offer)    │
       │    createAnswer()                 │
       │                                   │
       │ 6. answer                          │
       │<──────────────────────────────────┤
       │                                   │
       │ 7. setRemoteDescription(answer)   │
       │                                   │
       │ 8. ICE Candidate 교환              │
       │<──────────────────────────────────>│
       │                                   │
       │ 9. P2P 연결 완료                   │
       │<==================================>│
       │                                   │
       │ 10. 미디어 스트림 전송             │
       │<==================================>│
```

---

## 🔧 코드에서의 실제 구현

### 송신자 측 (사용자 A)

```javascript
// 1. 피어 연결 생성
await this.createPeerConnection(userB.sid, true);  // isInitiator = true

// 2. Offer 생성 및 전송
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
this.socket.emit('offer', { target: userB.sid, offer: offer });

// 3. Answer 수신
this.socket.on('answer', async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// 4. ICE Candidate 교환
peerConnection.onicecandidate = (event) => {
    this.socket.emit('ice_candidate', { target: userB.sid, candidate: event.candidate });
};
```

### 수신자 측 (사용자 B)

```javascript
// 1. Offer 수신
this.socket.on('offer', async (data) => {
    await this.createPeerConnection(data.from, false);  // isInitiator = false
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    
    // 2. Answer 생성 및 전송
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    this.socket.emit('answer', { target: data.from, answer: answer });
});

// 3. 원격 스트림 수신
peerConnection.ontrack = (event) => {
    const remoteStream = event.streams[0];
    this.addVideoElement(targetSid, remoteStream, 'User', false);
};
```

---

## ⚠️ 주의사항

### 1. 양방향 연결

- **각 사용자는 송신자이자 수신자입니다**
- 사용자 A → 사용자 B 연결
- 사용자 B → 사용자 A 연결
- **두 개의 독립적인 WebRTC 연결**이 필요합니다!

### 2. 멀티 사용자 지원

- 3명 이상일 때: 각 사용자가 다른 모든 사용자와 개별적으로 연결
- 예: 3명이면 3개의 연결 (A↔B, A↔C, B↔C)

### 3. NAT/방화벽 문제

- 일부 네트워크 환경에서는 P2P 연결이 실패할 수 있음
- 이 경우 TURN 서버가 필요하지만, 현재는 STUN만 사용 중

---

## 🎯 요약

1. **Socket.io (시그널링)**: 연결 정보(Offer/Answer/ICE) 교환
2. **WebRTC (P2P)**: 실제 미디어 스트림 전송
3. **STUN 서버**: 공인 IP 확인 및 연결 가능성 확인
4. **양방향**: 각 사용자가 서로에게 미디어를 전송

**결과**: 서버를 거치지 않고 사용자 간 직접 화상 통화 가능! 🎉

