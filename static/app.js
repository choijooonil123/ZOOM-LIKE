/**
 * ZOOM 클론 - 클라이언트 애플리케이션
 * WebRTC 및 Socket.io를 사용한 실시간 화상 회의
 */

class ZoomClone {
    constructor() {
        this.socket = null;
        this.localStream = null;
        this.screenStream = null;
        this.peers = {};
        this.currentRoomId = null;
        this.currentUsername = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isScreenSharing = false;
        this.connectionMode = null; // 'sender' or 'receiver'
        this.targetUsername = null;
        
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        // 로비 요소
        this.lobbyScreen = document.getElementById('lobby');
        this.meetingScreen = document.getElementById('meeting');
        this.usernameInput = document.getElementById('username-input');
        this.targetUsernameInput = document.getElementById('target-username-input');
        this.connectBtn = document.getElementById('connect-btn');
        this.lobbyError = document.getElementById('lobby-error');
        
        // 회의 요소
        this.videoGrid = document.getElementById('video-grid');
        this.micBtn = document.getElementById('mic-btn');
        this.videoBtn = document.getElementById('video-btn');
        this.screenShareBtn = document.getElementById('screen-share-btn');
        this.chatBtn = document.getElementById('chat-btn');
        this.leaveBtn = document.getElementById('leave-btn');
        this.chatSidebar = document.getElementById('chat-sidebar');
        this.closeChatBtn = document.getElementById('close-chat-btn');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.currentUsernameDisplay = document.getElementById('current-username');
        this.roomIdDisplay = document.getElementById('room-id-display');
    }

    initializeEventListeners() {
        // 로비 이벤트
        this.connectBtn.addEventListener('click', () => this.startConnection());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startConnection();
        });
        this.targetUsernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startConnection();
        });
        
        // 회의 컨트롤 이벤트
        this.micBtn.addEventListener('click', () => this.toggleAudio());
        this.videoBtn.addEventListener('click', () => this.toggleVideo());
        this.screenShareBtn.addEventListener('click', () => this.toggleScreenShare());
        this.chatBtn.addEventListener('click', () => this.toggleChat());
        this.closeChatBtn.addEventListener('click', () => this.toggleChat());
        this.leaveBtn.addEventListener('click', () => this.leaveRoom());
        
        // 채팅 이벤트
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('서버에 연결되었습니다:', this.socket.id);
        });

        this.socket.on('connected', (data) => {
            console.log('연결 확인:', data);
        });

        this.socket.on('user-matched', async (data) => {
            console.log('사용자 매칭됨:', data);
            const { target_sid, target_username, is_sender } = data;
            this.targetUsername = target_username;
            await this.createPeerConnection(target_sid, is_sender);
        });

        this.socket.on('connection-ready', (data) => {
            console.log('연결 준비 완료:', data);
            this.showInfo('연결이 준비되었습니다. 상대방과 연결을 시작합니다.');
        });

        this.socket.on('connection-waiting', (data) => {
            console.log('연결 대기 중:', data);
            this.roomIdDisplay.textContent = data.message || '연결 대기 중...';
            this.showInfo(data.message || '다른 사용자를 기다리는 중...');
        });

        this.socket.on('user-left', (data) => {
            console.log('사용자 나감:', data);
            this.removeVideoElement(data.sid);
            if (this.peers[data.sid]) {
                this.peers[data.sid].close();
                delete this.peers[data.sid];
            }
        });

        this.socket.on('offer', async (data) => {
            console.log('Offer 수신:', data);
            await this.handleOffer(data);
        });

        this.socket.on('answer', async (data) => {
            console.log('Answer 수신:', data);
            await this.handleAnswer(data);
        });

        this.socket.on('ice-candidate', async (data) => {
            console.log('ICE Candidate 수신:', data);
            await this.handleIceCandidate(data);
        });

        this.socket.on('message', (data) => {
            this.displayMessage(data);
        });

        this.socket.on('video-toggled', (data) => {
            this.updateRemoteVideoState(data.sid, data.enabled, 'video');
        });

        this.socket.on('audio-toggled', (data) => {
            this.updateRemoteVideoState(data.sid, data.enabled, 'audio');
        });

        this.socket.on('screen-share', (data) => {
            console.log('화면 공유 상태 변경:', data);
            // 화면 공유 UI 업데이트
        });

        this.socket.on('error', (data) => {
            this.showError(data.message);
        });
    }

    async startConnection() {
        const username = this.usernameInput.value.trim();
        const targetUsername = this.targetUsernameInput.value.trim();

        if (!username) {
            this.showError('이름을 입력하세요');
            return;
        }

        this.currentUsername = username;
        this.targetUsername = targetUsername || null;

        // Socket 초기화
        if (!this.socket) {
            await this.initializeSocket();
        }

        // 로컬 스트림 가져오기
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
        } catch (error) {
            console.error('미디어 스트림 가져오기 실패:', error);
            this.showError('카메라/마이크 접근 권한이 필요합니다');
            return;
        }

        // 로컬 비디오 표시
        this.addVideoElement(this.socket.id, this.localStream, username, true);
        
        // 연결 시작 (방 없이 직접 연결)
        this.socket.emit('start_connection', {
            username: username,
            target_username: targetUsername || null
        });

        // 화면 전환
        this.lobbyScreen.classList.add('hidden');
        this.meetingScreen.classList.remove('hidden');
        this.currentUsernameDisplay.textContent = username;
        this.roomIdDisplay.textContent = targetUsername ? `연결 대상: ${targetUsername}` : '자동 매칭 중...';
    }

    async createPeerConnection(targetSid, isInitiator) {
        if (this.peers[targetSid]) {
            console.log('이미 피어 연결이 존재합니다:', targetSid);
            return;
        }

        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        const peerConnection = new RTCPeerConnection(configuration);
        this.peers[targetSid] = peerConnection;

        // 로컬 스트림 추가
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        // 원격 스트림 처리
        peerConnection.ontrack = (event) => {
            console.log('원격 스트림 수신:', targetSid);
            const remoteStream = event.streams[0];
            this.addVideoElement(targetSid, remoteStream, 'User', false);
        };

        // ICE Candidate 처리
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice_candidate', {
                    target: targetSid,
                    candidate: event.candidate
                });
            }
        };

        // 연결 상태 변경
        peerConnection.onconnectionstatechange = () => {
            console.log(`연결 상태 (${targetSid}):`, peerConnection.connectionState);
            if (peerConnection.connectionState === 'failed' || 
                peerConnection.connectionState === 'disconnected') {
                // 재연결 시도
                setTimeout(() => {
                    if (this.peers[targetSid] && 
                        this.peers[targetSid].connectionState !== 'connected') {
                        this.createPeerConnection(targetSid, true);
                    }
                }, 3000);
            }
        };

        // Offer 생성 및 전송
        if (isInitiator) {
            try {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                this.socket.emit('offer', {
                    target: targetSid,
                    offer: offer
                });
            } catch (error) {
                console.error('Offer 생성 실패:', error);
            }
        }
    }

    async handleOffer(data) {
        const peerConnection = this.peers[data.from];
        if (!peerConnection) {
            await this.createPeerConnection(data.from, false);
        }

        const pc = this.peers[data.from];
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.socket.emit('answer', {
                target: data.from,
                answer: answer
            });
        } catch (error) {
            console.error('Answer 생성 실패:', error);
        }
    }

    async handleAnswer(data) {
        const peerConnection = this.peers[data.from];
        if (peerConnection) {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            } catch (error) {
                console.error('Answer 설정 실패:', error);
            }
        }
    }

    async handleIceCandidate(data) {
        const peerConnection = this.peers[data.from];
        if (peerConnection) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
                console.error('ICE Candidate 추가 실패:', error);
            }
        }
    }

    addVideoElement(sid, stream, username, isLocal) {
        // 기존 요소 제거
        const existing = document.getElementById(`video-${sid}`);
        if (existing) {
            existing.remove();
        }

        const videoWrapper = document.createElement('div');
        videoWrapper.id = `video-${sid}`;
        videoWrapper.className = 'video-wrapper';
        if (isLocal) {
            videoWrapper.classList.add('local');
        }

        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        if (isLocal) {
            video.muted = true; // 로컬 비디오는 음소거
        }

        const label = document.createElement('div');
        label.className = 'video-label';
        label.textContent = isLocal ? `${username} (나)` : username;

        const controls = document.createElement('div');
        controls.className = 'video-controls-overlay';
        if (!isLocal) {
            // 원격 비디오에 대한 추가 컨트롤 (필요시)
        }

        videoWrapper.appendChild(video);
        videoWrapper.appendChild(label);
        videoWrapper.appendChild(controls);

        this.videoGrid.appendChild(videoWrapper);

        // 비디오 로드 이벤트
        video.onloadedmetadata = () => {
            video.play().catch(err => console.error('비디오 재생 실패:', err));
        };
    }

    removeVideoElement(sid) {
        const videoElement = document.getElementById(`video-${sid}`);
        if (videoElement) {
            videoElement.remove();
        }
    }

    updateRemoteVideoState(sid, enabled, type) {
        const videoWrapper = document.getElementById(`video-${sid}`);
        if (!videoWrapper) return;

        if (type === 'video') {
            if (!enabled) {
                videoWrapper.classList.add('no-video');
            } else {
                videoWrapper.classList.remove('no-video');
            }
        } else if (type === 'audio') {
            if (!enabled) {
                videoWrapper.classList.add('muted');
            } else {
                videoWrapper.classList.remove('muted');
            }
        }
    }

    async toggleAudio() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            this.isAudioEnabled = !this.isAudioEnabled;
            this.micBtn.classList.toggle('muted', !this.isAudioEnabled);
            
            // 다른 사용자들에게 알림
            this.socket.emit('toggle_audio', {
                enabled: this.isAudioEnabled
            });
        }
    }

    async toggleVideo() {
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            this.isVideoEnabled = !this.isVideoEnabled;
            this.videoBtn.classList.toggle('muted', !this.isVideoEnabled);
            
            // 다른 사용자들에게 알림
            this.socket.emit('toggle_video', {
                enabled: this.isVideoEnabled
            });
        }
    }

    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // 화면 공유 시작
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });

                // 화면 공유 스트림을 모든 피어에 전송
                const videoTrack = this.screenStream.getVideoTracks()[0];
                Object.values(this.peers).forEach(peer => {
                    const sender = peer.getSenders().find(s => 
                        s.track && s.track.kind === 'video'
                    );
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                });

                // 로컬 비디오 업데이트
                const localVideo = document.querySelector(`#video-${this.socket.id} video`);
                if (localVideo) {
                    localVideo.srcObject = new MediaStream([videoTrack, ...this.localStream.getAudioTracks()]);
                }

                this.isScreenSharing = true;
                this.screenShareBtn.classList.add('active');

                // 화면 공유 종료 이벤트
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };

                this.socket.emit('screen_share', { sharing: true });
            } else {
                this.stopScreenShare();
            }
        } catch (error) {
            console.error('화면 공유 실패:', error);
            this.showError('화면 공유에 실패했습니다');
        }
    }

    stopScreenShare() {
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }

        // 원래 비디오 스트림으로 복원
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            Object.values(this.peers).forEach(peer => {
                const sender = peer.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender && videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
            });

            // 로컬 비디오 복원
            const localVideo = document.querySelector(`#video-${this.socket.id} video`);
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }
        }

        this.isScreenSharing = false;
        this.screenShareBtn.classList.remove('active');
        this.socket.emit('screen_share', { sharing: false });
    }

    toggleChat() {
        this.chatSidebar.classList.toggle('hidden');
        this.chatBtn.classList.toggle('active', !this.chatSidebar.classList.contains('hidden'));
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        this.socket.emit('message', { message });
        this.chatInput.value = '';
    }

    displayMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';

        const usernameDiv = document.createElement('div');
        usernameDiv.className = 'username';
        usernameDiv.textContent = data.username;

        const messageTextDiv = document.createElement('div');
        messageTextDiv.className = 'message-text';
        messageTextDiv.textContent = data.message;

        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'timestamp';
        const date = new Date(data.timestamp);
        timestampDiv.textContent = date.toLocaleTimeString('ko-KR');

        messageDiv.appendChild(usernameDiv);
        messageDiv.appendChild(messageTextDiv);
        messageDiv.appendChild(timestampDiv);

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async leaveRoom() {
        // 모든 피어 연결 종료
        Object.values(this.peers).forEach(peer => {
            peer.close();
        });
        this.peers = {};

        // 스트림 종료
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }

        // Socket 연결 종료
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        // 비디오 그리드 초기화
        this.videoGrid.innerHTML = '';

        // 화면 전환
        this.meetingScreen.classList.add('hidden');
        this.lobbyScreen.classList.remove('hidden');
        this.chatSidebar.classList.add('hidden');
        this.chatMessages.innerHTML = '';
        
        this.currentRoomId = null;
        this.currentUsername = null;
    }

    showError(message) {
        this.lobbyError.textContent = message;
        this.lobbyError.style.color = '#ff4444';
        setTimeout(() => {
            this.lobbyError.textContent = '';
        }, 5000);
    }

    showInfo(message) {
        this.lobbyError.textContent = message;
        this.lobbyError.style.color = '#44ff44';
        setTimeout(() => {
            this.lobbyError.textContent = '';
        }, 5000);
    }
}

// 전역 에러 핸들러 - Chrome 확장 프로그램 에러 무시
window.addEventListener('error', (event) => {
    // Chrome 확장 프로그램 관련 에러는 무시
    if (event.message && event.message.includes('message channel closed')) {
        event.preventDefault();
        return false;
    }
});

window.addEventListener('unhandledrejection', (event) => {
    // Chrome 확장 프로그램 관련 Promise rejection 무시
    if (event.reason && event.reason.message && event.reason.message.includes('message channel closed')) {
        event.preventDefault();
        return false;
    }
});

// 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    window.zoomClone = new ZoomClone();
    console.log('ZOOM 클론 애플리케이션이 시작되었습니다');
});

