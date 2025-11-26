/**
 * ZOOM 클론 - 클라이언트 애플리케이션
 * WebRTC 및 Socket.io를 사용한 실시간 화상 회의
 */

// 백엔드 서버 URL 설정
// 로컬 개발: 빈 문자열 (같은 서버 사용)
// 프로덕션: Render 백엔드 URL
const BACKEND_URL = 'https://zoom-like.onrender.com';

class ZoomClone {
    constructor() {
        this.socket = null;
        this.localStream = null;
        this.screenStream = null;
        this.peers = {};
        this.currentRoomId = null;
        this.currentUsername = null;
        this.currentUser = null; // 로그인한 사용자 정보
        this.authToken = null; // JWT 토큰
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isScreenSharing = false;
        this.isRecording = false;
        this.isScreenRecording = false;
        this.mediaRecorder = null;
        this.screenRecorder = null;
        this.recordedChunks = [];
        this.screenRecordedChunks = [];
        this.recordedStream = null;
        this.recordingInterval = null;
        
        // 가상 배경 관련
        this.bodyPixModel = null;
        this.virtualBackgroundEnabled = false;
        this.virtualBackgroundType = 'none';
        this.backgroundImage = null;
        this.processedStream = null;
        this.vbCanvas = null;
        this.vbContext = null;
        this.vbVideo = null;
        this.vbProcessingInterval = null;
        
        // 화이트보드 관련
        this.whiteboardCanvas = null;
        this.whiteboardContext = null;
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.brushSize = 5;
        this.lastX = 0;
        this.lastY = 0;
        this.startX = 0;
        this.startY = 0;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadRoomIdFromURL();
        this.checkAuthStatus();
    }

    initializeElements() {
        // 로그인 요소
        this.loginScreen = document.getElementById('login');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.loginTabs = document.querySelectorAll('.login-tabs .tab-btn');
        this.loginUsernameInput = document.getElementById('login-username');
        this.loginPasswordInput = document.getElementById('login-password');
        this.loginSubmitBtn = document.getElementById('login-submit-btn');
        this.loginError = document.getElementById('login-error');
        this.registerUsernameInput = document.getElementById('register-username');
        this.registerEmailInput = document.getElementById('register-email');
        this.registerPasswordInput = document.getElementById('register-password');
        this.registerSubmitBtn = document.getElementById('register-submit-btn');
        this.registerError = document.getElementById('register-error');
        this.guestBtn = document.getElementById('guest-btn');
        
        // 로비 요소
        this.lobbyScreen = document.getElementById('lobby');
        this.meetingScreen = document.getElementById('meeting');
        this.usernameInput = document.getElementById('username-input');
        this.roomIdInput = document.getElementById('room-id-input');
        this.joinBtn = document.getElementById('join-btn');
        this.createBtn = document.getElementById('create-btn');
        this.viewTimelineBtn = document.getElementById('view-timeline-btn');
        this.lobbyError = document.getElementById('lobby-error');
        this.meetingsModal = document.getElementById('meetings-modal');
        this.closeMeetingsModal = document.getElementById('close-meetings-modal');
        this.meetingsList = document.getElementById('meetings-list');
        
        // 회의 요소
        this.videoGrid = document.getElementById('video-grid');
        this.micBtn = document.getElementById('mic-btn');
        this.videoBtn = document.getElementById('video-btn');
        this.screenShareBtn = document.getElementById('screen-share-btn');
        this.screenRecordBtn = document.getElementById('screen-record-btn');
        this.virtualBackgroundBtn = document.getElementById('virtual-background-btn');
        this.recordBtn = document.getElementById('record-btn');
        this.chatBtn = document.getElementById('chat-btn');
        this.whiteboardBtn = document.getElementById('whiteboard-btn');
        this.timelineBtn = document.getElementById('timeline-btn');
        this.timelinePanel = document.getElementById('timeline-panel');
        this.closeTimelineBtn = document.getElementById('close-timeline-btn');
        this.timelineList = document.getElementById('timeline-list');
        this.leaveBtn = document.getElementById('leave-btn');
        this.recordingIndicator = document.getElementById('recording-indicator');
        this.virtualBackgroundPanel = document.getElementById('virtual-background-panel');
        this.closeVbPanel = document.getElementById('close-vb-panel');
        this.backgroundRadios = document.querySelectorAll('input[name="background"]');
        this.customBackgroundInput = document.getElementById('custom-background');
        this.uploadBackgroundBtn = document.getElementById('upload-background');
        this.chatSidebar = document.getElementById('chat-sidebar');
        this.closeChatBtn = document.getElementById('close-chat-btn');
        this.chatTab = document.getElementById('chat-tab');
        this.filesTab = document.getElementById('files-tab');
        this.chatTabBtns = document.querySelectorAll('.tab-btn');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.fileInput = document.getElementById('file-input');
        this.uploadFileBtn = document.getElementById('upload-file-btn');
        this.filesList = document.getElementById('files-list');
        
        // 화이트보드 요소
        this.whiteboardPanel = document.getElementById('whiteboard-panel');
        this.whiteboardCanvas = document.getElementById('whiteboard-canvas');
        this.whiteboardToolBtns = document.querySelectorAll('.tool-btn');
        this.colorPicker = document.getElementById('color-picker');
        this.brushSizeInput = document.getElementById('brush-size');
        this.brushSizeDisplay = document.getElementById('brush-size-display');
        this.clearWhiteboardBtn = document.getElementById('clear-whiteboard-btn');
        this.closeWhiteboardBtn = document.getElementById('close-whiteboard-btn');
        this.currentUsernameDisplay = document.getElementById('current-username');
        this.roomIdDisplay = document.getElementById('room-id-display');
    }

    initializeEventListeners() {
        // 로그인 이벤트
        this.loginTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchAuthTab(tabName);
            });
        });
        this.loginSubmitBtn.addEventListener('click', () => this.handleLogin());
        this.registerSubmitBtn.addEventListener('click', () => this.handleRegister());
        if (this.guestBtn) {
            this.guestBtn.addEventListener('click', () => this.continueAsGuest());
        } else {
            console.warn('게스트 버튼을 찾을 수 없습니다.');
        }
        this.loginPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        this.registerPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
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
        if (this.micBtn) {
            this.micBtn.addEventListener('click', () => this.toggleAudio());
        }
        if (this.videoBtn) {
            this.videoBtn.addEventListener('click', () => this.toggleVideo());
        }
        if (this.screenShareBtn) {
            this.screenShareBtn.addEventListener('click', () => this.toggleScreenShare());
        }
        if (this.screenRecordBtn) {
            this.screenRecordBtn.addEventListener('click', () => this.toggleScreenRecording());
        }
        if (this.virtualBackgroundBtn) {
            this.virtualBackgroundBtn.addEventListener('click', () => this.toggleVirtualBackgroundPanel());
        }
        if (this.recordBtn) {
            this.recordBtn.addEventListener('click', () => this.toggleRecording());
        }
        if (this.chatBtn) {
            this.chatBtn.addEventListener('click', () => this.toggleChat());
        }
        if (this.closeVbPanel) {
            this.closeVbPanel.addEventListener('click', () => this.toggleVirtualBackgroundPanel());
        }
        if (this.uploadBackgroundBtn && this.customBackgroundInput) {
            this.uploadBackgroundBtn.addEventListener('click', () => this.customBackgroundInput.click());
        }
        
        // 가상 배경 옵션 변경
        this.backgroundRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setVirtualBackground(e.target.value);
            });
        });
        
        this.customBackgroundInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.loadCustomBackground(e.target.files[0]);
            }
        });
        this.closeChatBtn.addEventListener('click', () => this.toggleChat());
        this.whiteboardBtn.addEventListener('click', () => this.toggleWhiteboard());
        this.closeWhiteboardBtn.addEventListener('click', () => this.toggleWhiteboard());
        this.timelineBtn.addEventListener('click', () => this.toggleTimeline());
        this.closeTimelineBtn.addEventListener('click', () => this.toggleTimeline());
        this.viewTimelineBtn.addEventListener('click', () => this.showMeetingsList());
        this.closeMeetingsModal.addEventListener('click', () => this.hideMeetingsModal());
        this.leaveBtn.addEventListener('click', () => this.leaveRoom());
        
        // 채팅 이벤트
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }
    
    checkAuthStatus() {
        // 로컬 스토리지에서 토큰 확인
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        
        if (token && user) {
            this.authToken = token;
            this.currentUser = JSON.parse(user);
            this.showLobby();
        } else {
            this.showLogin();
        }
    }
    
    showLogin() {
        if (this.loginScreen) this.loginScreen.classList.remove('hidden');
        if (this.lobbyScreen) this.lobbyScreen.classList.add('hidden');
        if (this.meetingScreen) this.meetingScreen.classList.add('hidden');
    }
    
    showLobby() {
        if (this.loginScreen) this.loginScreen.classList.add('hidden');
        if (this.lobbyScreen) this.lobbyScreen.classList.remove('hidden');
        if (this.meetingScreen) this.meetingScreen.classList.add('hidden');
        
        // 게스트 모드인 경우 회의 기록 보기 버튼 숨기기
        if (!this.authToken || !this.currentUser) {
            if (this.viewTimelineBtn) {
                this.viewTimelineBtn.style.display = 'none';
            }
        } else {
            if (this.viewTimelineBtn) {
                this.viewTimelineBtn.style.display = '';
            }
        }
    }
    
    switchAuthTab(tabName) {
        this.loginTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        if (tabName === 'login') {
            this.loginForm.classList.remove('hidden');
            this.registerForm.classList.add('hidden');
        } else {
            this.loginForm.classList.add('hidden');
            this.registerForm.classList.remove('hidden');
        }
    }
    
    async handleLogin() {
        const username = this.loginUsernameInput.value.trim();
        const password = this.loginPasswordInput.value;
        
        if (!username || !password) {
            this.showAuthError(this.loginError, '사용자명과 비밀번호를 입력하세요');
            return;
        }
        
        try {
            const apiUrl = BACKEND_URL ? `${BACKEND_URL}/api/login` : '/api/login';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.authToken = data.access_token;
                this.currentUser = data.user;
                
                // 로컬 스토리지에 저장
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                // 로비 화면으로 이동
                this.showLobby();
                this.clearAuthErrors();
            } else {
                this.showAuthError(this.loginError, data.detail || '로그인에 실패했습니다');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            this.showAuthError(this.loginError, '서버 연결에 실패했습니다');
        }
    }
    
    async handleRegister() {
        const username = this.registerUsernameInput.value.trim();
        const email = this.registerEmailInput.value.trim();
        const password = this.registerPasswordInput.value;
        
        if (!username || !email || !password) {
            this.showAuthError(this.registerError, '모든 필드를 입력하세요');
            return;
        }
        
        if (password.length < 6) {
            this.showAuthError(this.registerError, '비밀번호는 최소 6자 이상이어야 합니다');
            return;
        }
        
        try {
            const apiUrl = BACKEND_URL ? `${BACKEND_URL}/api/register` : '/api/register';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.authToken = data.access_token;
                this.currentUser = data.user;
                
                // 로컬 스토리지에 저장
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                // 로비 화면으로 이동
                this.showLobby();
                this.clearAuthErrors();
            } else {
                this.showAuthError(this.registerError, data.detail || '회원가입에 실패했습니다');
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
            this.showAuthError(this.registerError, '서버 연결에 실패했습니다');
        }
    }
    
    continueAsGuest() {
        // 게스트 모드로 로비 화면으로 이동 (인증 없이)
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.showLobby();
    }
    
    showAuthError(element, message) {
        if (element) {
            element.textContent = message;
            setTimeout(() => {
                element.textContent = '';
            }, 5000);
        }
    }
    
    clearAuthErrors() {
        if (this.loginError) this.loginError.textContent = '';
        if (this.registerError) this.registerError.textContent = '';
    }
    
    showError(element, message) {
        if (element) {
            element.textContent = message;
            setTimeout(() => {
                element.textContent = '';
            }, 5000);
        }
    }

    async initializeSocket() {
        // 백엔드 URL이 설정되어 있으면 사용, 없으면 같은 서버
        const socketUrl = BACKEND_URL || window.location.origin;
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

        this.socket.on('file-shared', (data) => {
            console.log('파일 공유됨:', data);
            this.displayFileNotification(data);
            this.loadFilesList();
        });

        this.socket.on('whiteboard-draw', (data) => {
            this.handleRemoteDraw(data);
        });

        this.socket.on('whiteboard-clear', () => {
            this.clearWhiteboardCanvas();
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
        this.saveRoomIdToURL(roomId);
        this.joinRoom();
    }
    
    loadRoomIdFromURL() {
        // URL 파라미터에서 방 ID 읽기
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        
        if (roomId && this.roomIdInput) {
            this.roomIdInput.value = roomId;
            // 로컬 스토리지에도 저장
            localStorage.setItem('lastRoomId', roomId);
        } else {
            // URL에 없으면 로컬 스토리지에서 복원
            const lastRoomId = localStorage.getItem('lastRoomId');
            if (lastRoomId && this.roomIdInput) {
                this.roomIdInput.value = lastRoomId;
            }
        }
    }
    
    saveRoomIdToURL(roomId) {
        // URL에 방 ID 추가 (히스토리 변경 없이)
        const url = new URL(window.location);
        url.searchParams.set('room', roomId);
        window.history.replaceState({}, '', url);
        
        // 로컬 스토리지에도 저장
        localStorage.setItem('lastRoomId', roomId);
    }
    
    clearRoomIdFromURL() {
        // URL에서 방 ID 제거
        const url = new URL(window.location);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url);
        
        // 로컬 스토리지에서도 제거
        localStorage.removeItem('lastRoomId');
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
        
        // 방 ID를 URL과 로컬 스토리지에 저장
        this.saveRoomIdToURL(roomId);

        // Socket 초기화
        if (!this.socket) {
            await this.initializeSocket();
        }

        // 로컬 스트림 가져오기 (모바일 최적화)
        try {
            // 모바일 기기 감지
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // 모바일에서는 전면 카메라 우선, 데스크톱에서는 기본 설정
            const videoConstraints = isMobile ? {
                facingMode: 'user', // 전면 카메라
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } : {
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            };

            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        } catch (error) {
            console.error('미디어 스트림 가져오기 실패:', error);
            let errorMessage = '카메라/마이크 접근 권한이 필요합니다';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = '카메라/마이크 접근 권한을 허용해주세요';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '카메라/마이크를 찾을 수 없습니다';
            } else if (error.name === 'NotReadableError') {
                errorMessage = '카메라/마이크가 다른 앱에서 사용 중입니다';
            }
            
            this.showError(errorMessage);
            return;
        }

        // 가상 배경 초기화
        await this.initializeVirtualBackground();
        
        // 로컬 비디오 표시
        const streamToUse = this.processedStream || this.localStream;
        this.addVideoElement(this.socket.id, streamToUse, username, true);
        
        // 방 참가
        this.socket.emit('join_room', {
            room_id: roomId,
            username: username,
            user_id: this.currentUser ? this.currentUser.id : null
        });

        // 화면 전환
        this.lobbyScreen.classList.add('hidden');
        this.meetingScreen.classList.remove('hidden');
        this.currentUsernameDisplay.textContent = username;
        this.roomIdDisplay.textContent = `방 ID: ${roomId}`;
        
        // 게스트 모드인 경우 타임라인 버튼 숨기기
        if (!this.authToken || !this.currentUser) {
            if (this.timelineBtn) {
                this.timelineBtn.style.display = 'none';
            }
        } else {
            if (this.timelineBtn) {
                this.timelineBtn.style.display = '';
            }
        }
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
                // 모바일 기기 감지
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                // 화면 공유 시작 (모바일 최적화)
                const videoConstraints = isMobile ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                };

                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: videoConstraints,
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

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            // 모든 비디오 스트림 수집
            const videoStreams = [];
            const audioStreams = [];

            // 로컬 스트림 추가
            if (this.localStream) {
                const videoTracks = this.localStream.getVideoTracks();
                const audioTracks = this.localStream.getAudioTracks();
                if (videoTracks.length > 0) videoStreams.push(...videoTracks);
                if (audioTracks.length > 0) audioStreams.push(...audioTracks);
            }

            // 원격 스트림 수집 (비디오 그리드에서)
            const videoElements = this.videoGrid.querySelectorAll('video');
            videoElements.forEach(video => {
                if (video.srcObject) {
                    const stream = video.srcObject;
                    const videoTracks = stream.getVideoTracks();
                    const audioTracks = stream.getAudioTracks();
                    if (videoTracks.length > 0) videoStreams.push(...videoTracks);
                    if (audioTracks.length > 0) audioStreams.push(...audioTracks);
                }
            });

            if (videoStreams.length === 0 && audioStreams.length === 0) {
                this.showError('녹화할 스트림이 없습니다');
                return;
            }

            // Canvas를 사용하여 비디오 그리드를 녹화
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 1920;
            canvas.height = 1080;

            // 비디오 그리드의 레이아웃에 맞춰 캔버스에 그리기
            const drawVideoGrid = () => {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const videos = Array.from(this.videoGrid.querySelectorAll('video'));
                const videoCount = videos.length;
                
                if (videoCount === 0) return;

                // 그리드 레이아웃 계산
                const cols = Math.ceil(Math.sqrt(videoCount));
                const rows = Math.ceil(videoCount / cols);
                const cellWidth = canvas.width / cols;
                const cellHeight = canvas.height / rows;

                videos.forEach((video, index) => {
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    const x = col * cellWidth;
                    const y = row * cellHeight;

                    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                        ctx.drawImage(video, x, y, cellWidth, cellHeight);
                    }
                });
            };

            // Canvas 스트림 생성
            const canvasStream = canvas.captureStream(30); // 30fps

            // 오디오 트랙 추가
            if (audioStreams.length > 0) {
                const audioContext = new AudioContext();
                const destination = audioContext.createMediaStreamDestination();
                
                audioStreams.forEach(track => {
                    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
                    source.connect(destination);
                });

                destination.stream.getAudioTracks().forEach(track => {
                    canvasStream.addTrack(track);
                });
            }

            // MediaRecorder 생성
            const options = {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 2500000
            };

            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8,opus';
            }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
            }

            this.mediaRecorder = new MediaRecorder(canvasStream, options);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.downloadRecording();
            };

            // 주기적으로 캔버스 업데이트
            this.recordingInterval = setInterval(drawVideoGrid, 33); // ~30fps

            // 녹화 시작
            this.mediaRecorder.start(1000); // 1초마다 데이터 수집
            this.isRecording = true;
            this.recordBtn.classList.add('active', 'recording');
            this.recordingIndicator.classList.remove('hidden');
            this.recordedStream = canvasStream;

            console.log('녹화 시작');
        } catch (error) {
            console.error('녹화 시작 실패:', error);
            this.showError('녹화를 시작할 수 없습니다');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }

        if (this.recordedStream) {
            this.recordedStream.getTracks().forEach(track => track.stop());
            this.recordedStream = null;
        }

        this.isRecording = false;
        this.recordBtn.classList.remove('active', 'recording');
        this.recordingIndicator.classList.add('hidden');

        console.log('녹화 중지');
    }

    downloadRecording() {
        if (this.recordedChunks.length === 0) {
            console.warn('녹화된 데이터가 없습니다');
            return;
        }

        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const roomId = this.currentRoomId || 'meeting';
        a.download = `zoom-clone-recording-${roomId}-${timestamp}.webm`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.recordedChunks = [];
        
        console.log('녹화 파일 다운로드 완료');
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
        // 녹화 중이면 중지
        if (this.isRecording) {
            this.stopRecording();
        }

        // 화면 녹화 중이면 중지
        if (this.isScreenRecording) {
            this.stopScreenRecording();
        }

        // 가상 배경 중지
        if (this.virtualBackgroundEnabled) {
            this.stopVirtualBackground();
        }

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
        
        // 방 ID는 유지 (다시 참가할 수 있도록)
        // URL과 로컬 스토리지에 저장된 방 ID는 그대로 유지
        // this.currentRoomId = null; // 주석 처리 - 방 ID 유지
        this.currentUsername = null;
    }

    showError(message) {
        if (this.lobbyError) {
            this.lobbyError.textContent = message;
            setTimeout(() => {
                if (this.lobbyError) {
                    this.lobbyError.textContent = '';
                }
            }, 5000);
        }
    }

    // 가상 배경 관련 메서드
    async initializeVirtualBackground() {
        try {
            // BodyPix 모델 로드
            this.bodyPixModel = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 0.75,
                quantBytes: 2
            });
            console.log('BodyPix 모델 로드 완료');
        } catch (error) {
            console.error('BodyPix 모델 로드 실패:', error);
        }

        // Canvas 및 비디오 요소 생성
        this.vbCanvas = document.createElement('canvas');
        this.vbContext = this.vbCanvas.getContext('2d');
        this.vbVideo = document.createElement('video');
        this.vbVideo.srcObject = this.localStream;
        this.vbVideo.autoplay = true;
        this.vbVideo.playsInline = true;
        
        this.vbVideo.addEventListener('loadedmetadata', () => {
            this.vbCanvas.width = this.vbVideo.videoWidth;
            this.vbCanvas.height = this.vbVideo.videoHeight;
        });
    }

    toggleVirtualBackgroundPanel() {
        this.virtualBackgroundPanel.classList.toggle('hidden');
        this.virtualBackgroundBtn.classList.toggle('active', !this.virtualBackgroundPanel.classList.contains('hidden'));
    }

    async setVirtualBackground(type) {
        this.virtualBackgroundType = type;
        
        if (type === 'none') {
            this.stopVirtualBackground();
            return;
        }

        if (!this.bodyPixModel || !this.localStream) {
            console.warn('가상 배경을 사용할 수 없습니다');
            return;
        }

        // 배경 이미지 로드
        if (type === 'blur') {
            this.backgroundImage = null;
        } else if (type.startsWith('image')) {
            await this.loadBackgroundImage(type);
        }

        this.startVirtualBackground();
    }

    async loadBackgroundImage(type) {
        const imageUrls = {
            'image1': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&h=1080&fit=crop',
            'image2': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
            'image3': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop'
        };

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.backgroundImage = img;
                resolve();
            };
            img.onerror = reject;
            img.src = imageUrls[type] || imageUrls['image1'];
        });
    }

    async loadCustomBackground(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.backgroundImage = img;
                    this.setVirtualBackground('custom');
                    resolve();
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async startVirtualBackground() {
        if (!this.localStream || !this.bodyPixModel) return;

        this.virtualBackgroundEnabled = true;
        this.vbVideo.srcObject = this.localStream;

        // Canvas 스트림 생성
        this.processedStream = this.vbCanvas.captureStream(30);

        // 오디오 트랙 추가
        const audioTracks = this.localStream.getAudioTracks();
        audioTracks.forEach(track => {
            this.processedStream.addTrack(track);
        });

        // 비디오 처리 루프
        this.processVideoFrame();

        // 로컬 비디오 업데이트
        const localVideo = document.querySelector(`#video-${this.socket.id} video`);
        if (localVideo) {
            localVideo.srcObject = this.processedStream;
        }

        // WebRTC 피어 연결 업데이트
        Object.values(this.peers).forEach(peer => {
            const sender = peer.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            if (sender) {
                const videoTrack = this.processedStream.getVideoTracks()[0];
                if (videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
            }
        });

        this.virtualBackgroundBtn.classList.add('active');
    }

    async processVideoFrame() {
        if (!this.virtualBackgroundEnabled || !this.vbVideo || !this.bodyPixModel) {
            return;
        }

        if (this.vbVideo.readyState >= 2) {
            // 세그멘테이션 수행
            const segmentation = await this.bodyPixModel.segmentPerson(this.vbVideo);

            // Canvas에 그리기
            this.vbContext.clearRect(0, 0, this.vbCanvas.width, this.vbCanvas.height);

            // 배경 그리기
            if (this.virtualBackgroundType === 'blur') {
                // 블러 효과
                this.vbContext.save();
                this.vbContext.filter = 'blur(20px)';
                this.vbContext.drawImage(this.vbVideo, 0, 0, this.vbCanvas.width, this.vbCanvas.height);
                this.vbContext.restore();
            } else if (this.backgroundImage) {
                // 배경 이미지
                this.vbContext.drawImage(
                    this.backgroundImage,
                    0, 0, this.vbCanvas.width, this.vbCanvas.height
                );
            }

            // 사람 마스크 적용
            const mask = bodyPix.toMask(segmentation);
            this.vbContext.globalCompositeOperation = 'source-in';
            this.vbContext.drawImage(this.vbVideo, 0, 0, this.vbCanvas.width, this.vbCanvas.height);
            this.vbContext.globalCompositeOperation = 'source-over';

            // 마스크된 사람 그리기
            this.vbContext.drawImage(this.vbVideo, 0, 0, this.vbCanvas.width, this.vbCanvas.height);
        }

        // 다음 프레임 처리
        requestAnimationFrame(() => this.processVideoFrame());
    }

    stopVirtualBackground() {
        this.virtualBackgroundEnabled = false;

        if (this.processedStream) {
            this.processedStream.getVideoTracks().forEach(track => track.stop());
            this.processedStream = null;
        }

        // 원래 스트림으로 복원
        const localVideo = document.querySelector(`#video-${this.socket.id} video`);
        if (localVideo && this.localStream) {
            localVideo.srcObject = this.localStream;
        }

        // WebRTC 피어 연결 복원
        Object.values(this.peers).forEach(peer => {
            const sender = peer.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            if (sender && this.localStream) {
                const videoTrack = this.localStream.getVideoTracks()[0];
                if (videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
            }
        });

        this.virtualBackgroundBtn.classList.remove('active');
    }

    // 화이트보드 관련 메서드
    initializeWhiteboard() {
        if (!this.whiteboardCanvas) return;
        
        this.whiteboardContext = this.whiteboardCanvas.getContext('2d');
        
        // Canvas 크기 설정
        const resizeCanvas = () => {
            const container = this.whiteboardCanvas.parentElement;
            this.whiteboardCanvas.width = container.clientWidth;
            this.whiteboardCanvas.height = container.clientHeight - 100; // 툴바 높이 고려
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // 그리기 이벤트
        this.whiteboardCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.whiteboardCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.whiteboardCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.whiteboardCanvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // 터치 이벤트 (모바일 최적화)
        this.whiteboardCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const coords = this.getCanvasCoordinates(e);
                this.startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
            }
        }, { passive: false });
        
        this.whiteboardCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                this.draw({ clientX: touch.clientX, clientY: touch.clientY });
            }
        }, { passive: false });
        
        this.whiteboardCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        }, { passive: false });
        
        this.whiteboardCanvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.stopDrawing();
        }, { passive: false });
    }

    toggleWhiteboard() {
        this.whiteboardPanel.classList.toggle('hidden');
        this.whiteboardBtn.classList.toggle('active', !this.whiteboardPanel.classList.contains('hidden'));
        
        if (!this.whiteboardPanel.classList.contains('hidden')) {
            // Canvas 크기 재조정
            setTimeout(() => {
                const container = this.whiteboardCanvas.parentElement;
                this.whiteboardCanvas.width = container.clientWidth;
                this.whiteboardCanvas.height = container.clientHeight - 100;
            }, 100);
        }
    }

    setTool(tool) {
        this.currentTool = tool;
        this.whiteboardToolBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }

    getCanvasCoordinates(e) {
        const rect = this.whiteboardCanvas.getBoundingClientRect();
        // 터치 이벤트 지원
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const coords = this.getCanvasCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;
        this.startX = coords.x;
        this.startY = coords.y;
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const coords = this.getCanvasCoordinates(e);
        const currentX = coords.x;
        const currentY = coords.y;

        if (this.currentTool === 'pen') {
            this.drawLine(this.lastX, this.lastY, currentX, currentY);
            this.sendDrawData({
                type: 'line',
                fromX: this.lastX,
                fromY: this.lastY,
                toX: currentX,
                toY: currentY,
                color: this.currentColor,
                size: this.brushSize
            });
        } else if (this.currentTool === 'eraser') {
            this.eraseLine(this.lastX, this.lastY, currentX, currentY);
            this.sendDrawData({
                type: 'erase',
                fromX: this.lastX,
                fromY: this.lastY,
                toX: currentX,
                toY: currentY,
                size: this.brushSize
            });
        }

        this.lastX = currentX;
        this.lastY = currentY;
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        if (this.currentTool === 'rectangle' || this.currentTool === 'circle' || this.currentTool === 'line') {
            const coords = this.getCanvasCoordinates({ clientX: this.lastX, clientY: this.lastY });
            this.drawShape(this.currentTool, this.startX, this.startY, coords.x, coords.y);
            this.sendDrawData({
                type: this.currentTool,
                fromX: this.startX,
                fromY: this.startY,
                toX: coords.x,
                toY: coords.y,
                color: this.currentColor,
                size: this.brushSize
            });
        }
        
        this.isDrawing = false;
    }

    drawLine(x1, y1, x2, y2) {
        this.whiteboardContext.beginPath();
        this.whiteboardContext.moveTo(x1, y1);
        this.whiteboardContext.lineTo(x2, y2);
        this.whiteboardContext.strokeStyle = this.currentColor;
        this.whiteboardContext.lineWidth = this.brushSize;
        this.whiteboardContext.lineCap = 'round';
        this.whiteboardContext.lineJoin = 'round';
        this.whiteboardContext.stroke();
    }

    eraseLine(x1, y1, x2, y2) {
        this.whiteboardContext.beginPath();
        this.whiteboardContext.moveTo(x1, y1);
        this.whiteboardContext.lineTo(x2, y2);
        this.whiteboardContext.strokeStyle = '#FFFFFF';
        this.whiteboardContext.lineWidth = this.brushSize * 2;
        this.whiteboardContext.lineCap = 'round';
        this.whiteboardContext.stroke();
    }

    drawShape(shape, x1, y1, x2, y2) {
        this.whiteboardContext.beginPath();
        this.whiteboardContext.strokeStyle = this.currentColor;
        this.whiteboardContext.lineWidth = this.brushSize;
        
        if (shape === 'rectangle') {
            const width = x2 - x1;
            const height = y2 - y1;
            this.whiteboardContext.strokeRect(x1, y1, width, height);
        } else if (shape === 'circle') {
            const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            this.whiteboardContext.arc(x1, y1, radius, 0, 2 * Math.PI);
            this.whiteboardContext.stroke();
        } else if (shape === 'line') {
            this.whiteboardContext.moveTo(x1, y1);
            this.whiteboardContext.lineTo(x2, y2);
            this.whiteboardContext.stroke();
        }
    }

    sendDrawData(data) {
        if (this.socket && this.currentRoomId) {
            this.socket.emit('whiteboard-draw', {
                room_id: this.currentRoomId,
                ...data
            });
        }
    }

    handleRemoteDraw(data) {
        if (data.type === 'line') {
            this.drawLine(data.fromX, data.fromY, data.toX, data.toY);
        } else if (data.type === 'erase') {
            this.eraseLine(data.fromX, data.fromY, data.toX, data.toY);
        } else if (data.type === 'rectangle' || data.type === 'circle' || data.type === 'line') {
            this.drawShape(data.type, data.fromX, data.fromY, data.toX, data.toY);
        }
    }

    clearWhiteboard() {
        if (this.socket && this.currentRoomId) {
            this.socket.emit('whiteboard-clear', {
                room_id: this.currentRoomId
            });
        }
        this.clearWhiteboardCanvas();
    }

    clearWhiteboardCanvas() {
        if (this.whiteboardContext) {
            this.whiteboardContext.clearRect(0, 0, this.whiteboardCanvas.width, this.whiteboardCanvas.height);
        }
    }
    
    // 타임라인 관련 메서드
    toggleTimeline() {
        this.timelinePanel.classList.toggle('hidden');
        this.timelineBtn.classList.toggle('active', !this.timelinePanel.classList.contains('hidden'));
        
        if (!this.timelinePanel.classList.contains('hidden') && this.currentRoomId) {
            this.loadTimeline();
        }
    }
    
    async loadTimeline() {
        if (!this.authToken || !this.currentRoomId) {
            this.timelineList.innerHTML = '<div class="timeline-empty">타임라인을 불러올 수 없습니다. 로그인이 필요합니다.</div>';
            return;
        }
        
        try {
            const apiUrl = BACKEND_URL ? `${BACKEND_URL}/api/meetings/room/${this.currentRoomId}/timeline` : `/api/meetings/room/${this.currentRoomId}/timeline`;
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayTimeline(data);
            } else {
                this.timelineList.innerHTML = '<div class="timeline-empty">타임라인을 불러올 수 없습니다.</div>';
            }
        } catch (error) {
            console.error('타임라인 로드 오류:', error);
            this.timelineList.innerHTML = '<div class="timeline-empty">타임라인을 불러오는 중 오류가 발생했습니다.</div>';
        }
    }
    
    displayTimeline(data) {
        this.timelineList.innerHTML = '';
        
        // 회의 정보
        const meetingInfo = document.createElement('div');
        meetingInfo.className = 'timeline-meeting-info';
        meetingInfo.innerHTML = `
            <h4>회의 정보</h4>
            <p><strong>회의실 ID:</strong> ${data.meeting.room_id}</p>
            <p><strong>시작:</strong> ${new Date(data.meeting.started_at).toLocaleString('ko-KR')}</p>
            ${data.meeting.ended_at ? `<p><strong>종료:</strong> ${new Date(data.meeting.ended_at).toLocaleString('ko-KR')}</p>` : ''}
            ${data.meeting.duration_seconds ? `<p><strong>지속 시간:</strong> ${this.formatDuration(data.meeting.duration_seconds)}</p>` : ''}
        `;
        this.timelineList.appendChild(meetingInfo);
        
        // 참가자 목록
        if (data.participants && data.participants.length > 0) {
            const participantsDiv = document.createElement('div');
            participantsDiv.className = 'timeline-participants';
            participantsDiv.innerHTML = '<h4>참가자</h4><ul>';
            data.participants.forEach(p => {
                participantsDiv.innerHTML += `<li>${p.username} (${new Date(p.joined_at).toLocaleTimeString('ko-KR')})</li>`;
            });
            participantsDiv.innerHTML += '</ul>';
            this.timelineList.appendChild(participantsDiv);
        }
        
        // 타임라인 이벤트
        if (data.timeline && data.timeline.length > 0) {
            const timelineDiv = document.createElement('div');
            timelineDiv.className = 'timeline-events';
            timelineDiv.innerHTML = '<h4>타임라인</h4>';
            
            data.timeline.forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.className = `timeline-event timeline-event-${event.type}`;
                
                const time = new Date(event.timestamp).toLocaleTimeString('ko-KR');
                let content = '';
                
                switch(event.type) {
                    case 'user_join':
                        content = `<span class="timeline-icon">👤</span> <strong>${event.username}</strong> 참가`;
                        break;
                    case 'user_leave':
                        content = `<span class="timeline-icon">👋</span> <strong>${event.username}</strong> 나감`;
                        break;
                    case 'chat':
                        content = `<span class="timeline-icon">💬</span> <strong>${event.username}:</strong> ${event.message}`;
                        break;
                    case 'screen_share':
                        content = `<span class="timeline-icon">🖥️</span> <strong>${event.username}</strong> 화면 공유 ${event.data?.sharing ? '시작' : '종료'}`;
                        break;
                    case 'recording':
                        content = `<span class="timeline-icon">🔴</span> 녹화 ${event.data?.started ? '시작' : '종료'}`;
                        break;
                    default:
                        content = `<span class="timeline-icon">📌</span> ${event.type}`;
                }
                
                eventDiv.innerHTML = `
                    <div class="timeline-time">${time}</div>
                    <div class="timeline-content">${content}</div>
                `;
                timelineDiv.appendChild(eventDiv);
            });
            
            this.timelineList.appendChild(timelineDiv);
        } else {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'timeline-empty';
            emptyDiv.textContent = '타임라인 이벤트가 없습니다.';
            this.timelineList.appendChild(emptyDiv);
        }
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}시간 ${minutes}분 ${secs}초`;
        } else if (minutes > 0) {
            return `${minutes}분 ${secs}초`;
        } else {
            return `${secs}초`;
        }
    }
    
    async showMeetingsList() {
        if (!this.authToken || !this.currentUser) {
            alert('회의 기록을 보려면 로그인이 필요합니다.\n게스트 모드에서는 회의 기록을 볼 수 없습니다.');
            return;
        }
        
        try {
            const apiUrl = BACKEND_URL ? `${BACKEND_URL}/api/meetings` : '/api/meetings';
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayMeetingsList(data.meetings);
                this.meetingsModal.classList.remove('hidden');
            } else {
                alert('회의 목록을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('회의 목록 로드 오류:', error);
            alert('회의 목록을 불러오는 중 오류가 발생했습니다.');
        }
    }
    
    displayMeetingsList(meetings) {
        this.meetingsList.innerHTML = '';
        
        if (meetings.length === 0) {
            this.meetingsList.innerHTML = '<div class="meetings-empty">참가한 회의가 없습니다.</div>';
            return;
        }
        
        meetings.forEach(meeting => {
            const meetingDiv = document.createElement('div');
            meetingDiv.className = 'meeting-item';
            meetingDiv.innerHTML = `
                <div class="meeting-info">
                    <h4>${meeting.room_id}</h4>
                    <p>${new Date(meeting.started_at).toLocaleString('ko-KR')}</p>
                    ${meeting.duration_seconds ? `<p>지속 시간: ${this.formatDuration(meeting.duration_seconds)}</p>` : ''}
                    <p>참가자: ${meeting.participant_count}명</p>
                </div>
                <button class="btn btn-small view-timeline" data-meeting-id="${meeting.id}">타임라인 보기</button>
            `;
            
            const viewBtn = meetingDiv.querySelector('.view-timeline');
            viewBtn.addEventListener('click', () => {
                this.viewMeetingTimeline(meeting.id);
            });
            
            this.meetingsList.appendChild(meetingDiv);
        });
    }
    
    async viewMeetingTimeline(meetingId) {
        if (!this.authToken) {
            alert('타임라인을 보려면 로그인이 필요합니다.');
            return;
        }
        
        try {
            const apiUrl = BACKEND_URL ? `${BACKEND_URL}/api/meetings/${meetingId}/timeline` : `/api/meetings/${meetingId}/timeline`;
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.hideMeetingsModal();
                this.displayTimeline(data);
                this.timelinePanel.classList.remove('hidden');
                this.timelineBtn.classList.add('active');
            } else {
                alert('타임라인을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('타임라인 로드 오류:', error);
            alert('타임라인을 불러오는 중 오류가 발생했습니다.');
        }
    }
    
    hideMeetingsModal() {
        this.meetingsModal.classList.add('hidden');
    }
}

// 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    // Service Worker 등록 (PWA 지원)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker 등록 성공:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker 등록 실패:', error);
            });
    }

    // 모바일 기기 감지 및 최적화
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
        // 모바일에서 풀스크린 모드 지원
        const preventZoom = (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        };
        document.addEventListener('touchstart', preventZoom, { passive: false });
        document.addEventListener('touchmove', preventZoom, { passive: false });
        
        // 모바일 브라우저 주소창 숨기기
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop) {
                // 스크롤 다운
                document.body.style.height = '100vh';
            } else {
                // 스크롤 업
                document.body.style.height = 'calc(100vh + 60px)';
            }
            lastScrollTop = scrollTop;
        }, false);
    }

    // 화면 회전 감지
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.location.reload();
        }, 100);
    });

    // 네트워크 상태 감지
    if ('onLine' in navigator) {
        window.addEventListener('online', () => {
            console.log('온라인 상태');
        });
        
        window.addEventListener('offline', () => {
            console.log('오프라인 상태');
            alert('인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.');
        });
    }

    window.zoomClone = new ZoomClone();
    console.log('ZOOM 클론 애플리케이션이 시작되었습니다');
});

