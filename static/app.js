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
        this.currentUserId = null;
        this.accessToken = localStorage.getItem('access_token');
        this.currentUser = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isScreenSharing = false;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.checkAuth();
        this.checkUrlParams();
    }

    initializeElements() {
        // 인증 요소
        this.authScreen = document.getElementById('auth');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.loginUsernameInput = document.getElementById('login-username');
        this.loginPasswordInput = document.getElementById('login-password');
        this.loginBtn = document.getElementById('login-btn');
        this.registerUsernameInput = document.getElementById('register-username');
        this.registerEmailInput = document.getElementById('register-email');
        this.registerPasswordInput = document.getElementById('register-password');
        this.registerBtn = document.getElementById('register-btn');
        
        // 요소가 제대로 로드되었는지 확인
        if (!this.registerBtn) {
            console.error('회원가입 버튼을 찾을 수 없습니다!');
        }
        if (!this.registerUsernameInput || !this.registerEmailInput || !this.registerPasswordInput) {
            console.error('회원가입 입력 필드를 찾을 수 없습니다!');
        }
        
        this.showRegisterLink = document.getElementById('show-register');
        this.showLoginLink = document.getElementById('show-login');
        this.showGuestLink = document.getElementById('show-guest');
        this.showGuestRegisterLink = document.getElementById('show-guest-register');
        this.authError = document.getElementById('auth-error');
        
        // 로비 요소
        this.lobbyScreen = document.getElementById('lobby');
        this.meetingScreen = document.getElementById('meeting');
        this.usernameInput = document.getElementById('username-input');
        this.roomIdInput = document.getElementById('room-id-input');
        this.joinBtn = document.getElementById('join-btn');
        this.createBtn = document.getElementById('create-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.loggedInUserDisplay = document.getElementById('logged-in-user');
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
        // 인증 이벤트
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        if (this.registerBtn) {
            this.registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('회원가입 버튼 클릭됨');
                this.register();
            });
        } else {
            console.error('회원가입 버튼을 찾을 수 없습니다!');
        }
        this.showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        this.showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        this.showGuestLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLobbyAsGuest();
        });
        this.showGuestRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLobbyAsGuest();
        });
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // 로그인/회원가입 폼 엔터키 이벤트
        this.loginPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        this.registerPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });
        
        // 로비 이벤트
        this.joinBtn.addEventListener('click', () => this.joinRoom());
        this.createBtn.addEventListener('click', () => this.createRoom());
        this.roomIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
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

    async     checkAuth() {
        // 토큰이 있으면 자동 로그인 시도
        if (this.accessToken) {
            this.getCurrentUser();
        } else {
            this.showAuthScreen();
        }
    }

    checkUrlParams() {
        // URL 파라미터에서 방 ID 확인
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        if (roomId && this.roomIdInput) {
            this.roomIdInput.value = roomId;
        }
    }

    async getCurrentUser() {
        try {
            const apiBaseUrl = window.API_BASE_URL || window.location.origin;
            const response = await fetch(`${apiBaseUrl}/api/me`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                this.currentUserId = user.id;
                this.showLobby();
            } else {
                // 토큰이 유효하지 않음
                localStorage.removeItem('access_token');
                this.accessToken = null;
                this.showAuthScreen();
            }
        } catch (error) {
            console.error('사용자 정보 조회 실패:', error);
            localStorage.removeItem('access_token');
            this.accessToken = null;
            this.showAuthScreen();
        }
    }

    async register() {
        console.log('회원가입 버튼 클릭됨');
        
        // 입력 필드가 제대로 연결되었는지 확인
        if (!this.registerUsernameInput || !this.registerEmailInput || !this.registerPasswordInput) {
            console.error('입력 필드를 찾을 수 없습니다');
            this.showAuthError('시스템 오류가 발생했습니다. 페이지를 새로고침해주세요.');
            return;
        }
        
        const username = this.registerUsernameInput.value.trim();
        const email = this.registerEmailInput.value.trim();
        const password = this.registerPasswordInput.value;

        console.log('입력값:', { username, email, passwordLength: password.length });

        if (!username || !email || !password) {
            this.showAuthError('모든 필드를 입력해주세요');
            return;
        }

        if (password.length < 6) {
            this.showAuthError('비밀번호는 최소 6자 이상이어야 합니다');
            return;
        }
        
        // 버튼 비활성화 (중복 클릭 방지)
        if (this.registerBtn) {
            this.registerBtn.disabled = true;
            this.registerBtn.textContent = '처리 중...';
        }

        try {
            const apiBaseUrl = window.API_BASE_URL || window.location.origin;
            console.log('회원가입 요청:', apiBaseUrl);
            
            const response = await fetch(`${apiBaseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, email, password }),
                credentials: 'include'
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                // JSON 파싱 실패 시 텍스트로 처리
                const text = await response.text();
                throw new Error(`서버 응답 오류 (${response.status}): ${text}`);
            }

            if (response.ok) {
                this.accessToken = data.access_token;
                this.currentUser = data.user;
                this.currentUserId = data.user.id;
                localStorage.setItem('access_token', this.accessToken);
                console.log('회원가입 성공:', data.user);
                this.showLobby();
            } else {
                const errorMsg = data.detail || data.message || '회원가입에 실패했습니다';
                console.error('회원가입 실패:', response.status, errorMsg);
                this.showAuthError(errorMsg);
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showAuthError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
            } else if (error.message.includes('timeout')) {
                this.showAuthError('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
            } else {
                this.showAuthError(error.message || '회원가입 중 오류가 발생했습니다');
            }
        } finally {
            // 버튼 다시 활성화
            if (this.registerBtn) {
                this.registerBtn.disabled = false;
                this.registerBtn.textContent = '회원가입';
            }
        }
    }

    async login() {
        const username = this.loginUsernameInput.value.trim();
        const password = this.loginPasswordInput.value;

        if (!username || !password) {
            this.showAuthError('사용자명과 비밀번호를 입력해주세요');
            return;
        }

        try {
            const apiBaseUrl = window.API_BASE_URL || window.location.origin;
            console.log('로그인 요청:', apiBaseUrl);
            
            const response = await fetch(`${apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                const text = await response.text();
                throw new Error(`서버 응답 오류 (${response.status}): ${text}`);
            }

            if (response.ok) {
                this.accessToken = data.access_token;
                this.currentUser = data.user;
                this.currentUserId = data.user.id;
                localStorage.setItem('access_token', this.accessToken);
                console.log('로그인 성공:', data.user);
                this.showLobby();
            } else {
                const errorMsg = data.detail || data.message || '로그인에 실패했습니다';
                console.error('로그인 실패:', response.status, errorMsg);
                this.showAuthError(errorMsg);
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showAuthError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
            } else if (error.message.includes('timeout')) {
                this.showAuthError('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
            } else {
                this.showAuthError(error.message || '로그인 중 오류가 발생했습니다');
            }
        }
    }

    logout() {
        this.accessToken = null;
        this.currentUser = null;
        this.currentUserId = null;
        localStorage.removeItem('access_token');
        this.showAuthScreen();
    }

    showAuthScreen() {
        this.authScreen.classList.remove('hidden');
        this.lobbyScreen.classList.add('hidden');
        this.meetingScreen.classList.add('hidden');
        this.showLoginForm();
    }

    showLoginForm() {
        this.loginForm.classList.remove('hidden');
        this.registerForm.classList.add('hidden');
        this.authError.textContent = '';
    }

    showRegisterForm() {
        this.registerForm.classList.remove('hidden');
        this.loginForm.classList.add('hidden');
        this.authError.textContent = '';
    }

    showLobby() {
        this.authScreen.classList.add('hidden');
        this.lobbyScreen.classList.remove('hidden');
        this.meetingScreen.classList.add('hidden');
        
        if (this.currentUser) {
            this.loggedInUserDisplay.textContent = `안녕하세요, ${this.currentUser.username}님`;
            this.usernameInput.value = this.currentUser.username;
            this.usernameInput.disabled = true;
        } else {
            this.loggedInUserDisplay.textContent = '';
            this.usernameInput.disabled = false;
        }
    }

    showLobbyAsGuest() {
        this.currentUser = null;
        this.currentUserId = null;
        this.showLobby();
    }

    showAuthError(message) {
        this.authError.textContent = message;
        setTimeout(() => {
            this.authError.textContent = '';
        }, 5000);
    }

    async initializeSocket() {
        // Socket.io 서버 URL 설정 (환경 변수 또는 현재 서버 사용)
        const socketUrl = window.SOCKET_SERVER_URL || window.location.origin;
        this.socket = io(socketUrl);
        
        this.socket.on('connect', () => {
            console.log('서버에 연결되었습니다:', this.socket.id);
        });

        this.socket.on('connected', (data) => {
            console.log('연결 확인:', data);
        });

        this.socket.on('user-joined', async (data) => {
            console.log('새 사용자 참가:', data);
            await this.createPeerConnection(data.sid, true);
        });

        this.socket.on('existing-users', async (data) => {
            console.log('기존 사용자들:', data);
            for (const user of data.users) {
                await this.createPeerConnection(user.sid, true);
            }
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

    generateRoomId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    createRoom() {
        const roomId = this.generateRoomId();
        this.roomIdInput.value = roomId;
        this.joinRoom();
    }

    async joinRoom() {
        const username = this.usernameInput.value.trim();
        const roomId = this.roomIdInput.value.trim();

        if (!username) {
            this.showError('이름을 입력하세요');
            return;
        }

        if (!roomId) {
            this.showError('회의실 ID를 입력하세요');
            return;
        }

        this.currentUsername = username;
        this.currentRoomId = roomId;

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
        
        // 방 참가
        this.socket.emit('join_room', {
            room_id: roomId,
            username: username,
            user_id: this.currentUserId  // 로그인한 사용자 ID 전달
        });

        // 화면 전환
        this.lobbyScreen.classList.add('hidden');
        this.meetingScreen.classList.remove('hidden');
        this.currentUsernameDisplay.textContent = username;
        this.roomIdDisplay.textContent = `방 ID: ${roomId}`;
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
        setTimeout(() => {
            this.lobbyError.textContent = '';
        }, 5000);
    }
}

// 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    window.zoomClone = new ZoomClone();
    console.log('ZOOM 클론 애플리케이션이 시작되었습니다');
});

