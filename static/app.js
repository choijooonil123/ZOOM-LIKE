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
        this.remoteUsers = {}; // 원격 사용자 정보 저장
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
        
        // 요소 확인
        if (!this.lobbyScreen) {
            console.error('로비 화면 요소를 찾을 수 없습니다!');
        }
        if (!this.authScreen) {
            console.error('인증 화면 요소를 찾을 수 없습니다!');
        }
        
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
        this.participantsBtn = document.getElementById('participants-btn');
        this.participantsSidebar = document.getElementById('participants-sidebar');
        this.closeParticipantsBtn = document.getElementById('close-participants-btn');
        this.participantsList = document.getElementById('participants-list');
        this.participantsCount = document.getElementById('participants-count');
    }

    initializeEventListeners() {
        // 인증 이벤트
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('로그인 버튼 클릭됨');
                this.login();
            });
        } else {
            console.error('로그인 버튼을 찾을 수 없습니다!');
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
        
        if (this.showRegisterLink) {
            this.showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        } else {
            console.error('회원가입 링크를 찾을 수 없습니다!');
        }
        
        if (this.showLoginLink) {
            this.showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        } else {
            console.error('로그인 링크를 찾을 수 없습니다!');
        }
        
        if (this.showGuestLink) {
            this.showGuestLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('게스트 링크 클릭됨 (로그인 폼)');
                console.log('showLobbyAsGuest 호출 전 상태:', {
                    authScreen: !!this.authScreen,
                    lobbyScreen: !!this.lobbyScreen
                });
                this.showLobbyAsGuest();
            });
        } else {
            console.error('게스트 링크를 찾을 수 없습니다! (ID: show-guest)');
        }
        
        if (this.showGuestRegisterLink) {
            this.showGuestRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('게스트 링크 클릭됨 (회원가입 폼)');
                console.log('showLobbyAsGuest 호출 전 상태:', {
                    authScreen: !!this.authScreen,
                    lobbyScreen: !!this.lobbyScreen
                });
                this.showLobbyAsGuest();
            });
        } else {
            console.error('게스트 회원가입 링크를 찾을 수 없습니다! (ID: show-guest-register)');
        }
        
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }
        
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
        if (this.participantsBtn) {
            this.participantsBtn.addEventListener('click', () => this.toggleParticipants());
        }
        if (this.closeParticipantsBtn) {
            this.closeParticipantsBtn.addEventListener('click', () => this.toggleParticipants());
        }
        this.leaveBtn.addEventListener('click', () => this.leaveRoom());
        
        // 채팅 이벤트
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async checkAuth() {
        // 토큰이 있으면 자동 로그인 시도
        if (this.accessToken) {
            await this.getCurrentUser();
        } else {
            // 로비가 이미 표시되어 있으면 (게스트 모드) 인증 화면으로 전환하지 않음
            if (this.lobbyScreen && !this.lobbyScreen.classList.contains('hidden')) {
                console.log('로비가 이미 표시되어 있어 인증 화면으로 전환하지 않습니다');
                return;
            }
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
        const username = this.loginUsernameInput?.value.trim();
        const password = this.loginPasswordInput?.value;

        if (!username || !password) {
            this.showAuthError('사용자명과 비밀번호를 입력해주세요');
            return;
        }

        // 버튼 비활성화
        if (this.loginBtn) {
            this.loginBtn.disabled = true;
            this.loginBtn.textContent = '로그인 중...';
        }

        try {
            const apiBaseUrl = window.API_BASE_URL || window.location.origin;
            console.log('로그인 요청:', apiBaseUrl, '사용자명:', username);
            
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
        } finally {
            // 버튼 다시 활성화
            if (this.loginBtn) {
                this.loginBtn.disabled = false;
                this.loginBtn.textContent = '로그인';
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
        console.log('showLobby 호출됨');
        console.log('authScreen:', this.authScreen);
        console.log('lobbyScreen:', this.lobbyScreen);
        console.log('meetingScreen:', this.meetingScreen);
        
        if (!this.authScreen || !this.lobbyScreen || !this.meetingScreen) {
            console.error('화면 요소를 찾을 수 없습니다!');
            return;
        }
        
        this.authScreen.classList.add('hidden');
        this.lobbyScreen.classList.remove('hidden');
        this.meetingScreen.classList.add('hidden');
        
        // 클래스 적용 확인
        console.log('화면 전환 완료');
        console.log('authScreen classes:', this.authScreen.className);
        console.log('lobbyScreen classes:', this.lobbyScreen.className);
        console.log('meetingScreen classes:', this.meetingScreen.className);
        
        // 실제 표시 상태 확인
        const authDisplay = window.getComputedStyle(this.authScreen).display;
        const lobbyDisplay = window.getComputedStyle(this.lobbyScreen).display;
        const authVisibility = window.getComputedStyle(this.authScreen).visibility;
        const lobbyVisibility = window.getComputedStyle(this.lobbyScreen).visibility;
        const authOpacity = window.getComputedStyle(this.authScreen).opacity;
        const lobbyOpacity = window.getComputedStyle(this.lobbyScreen).opacity;
        const authZIndex = window.getComputedStyle(this.authScreen).zIndex;
        const lobbyZIndex = window.getComputedStyle(this.lobbyScreen).zIndex;
        
        console.log('authScreen display:', authDisplay);
        console.log('lobbyScreen display:', lobbyDisplay);
        console.log('authScreen visibility:', authVisibility);
        console.log('lobbyScreen visibility:', lobbyVisibility);
        console.log('authScreen opacity:', authOpacity);
        console.log('lobbyScreen opacity:', lobbyOpacity);
        console.log('authScreen zIndex:', authZIndex);
        console.log('lobbyScreen zIndex:', lobbyZIndex);
        
        // lobbyScreen이 실제로 DOM에 보이는지 확인
        const lobbyRect = this.lobbyScreen.getBoundingClientRect();
        console.log('lobbyScreen 위치:', lobbyRect);
        console.log('lobbyScreen offsetWidth:', this.lobbyScreen.offsetWidth);
        console.log('lobbyScreen offsetHeight:', this.lobbyScreen.offsetHeight);
        
        // lobby-container 존재 여부 확인
        const lobbyContainer = this.lobbyScreen.querySelector('.lobby-container');
        console.log('lobby-container 존재:', !!lobbyContainer);
        if (lobbyContainer) {
            const containerRect = lobbyContainer.getBoundingClientRect();
            console.log('lobby-container 위치:', containerRect);
        }
        
        if (this.currentUser) {
            if (this.loggedInUserDisplay) {
                this.loggedInUserDisplay.textContent = `안녕하세요, ${this.currentUser.username}님`;
            }
            if (this.usernameInput) {
                this.usernameInput.value = this.currentUser.username;
                this.usernameInput.disabled = true;
            }
        } else {
            if (this.loggedInUserDisplay) {
                this.loggedInUserDisplay.textContent = '';
            }
            if (this.usernameInput) {
                this.usernameInput.disabled = false;
                this.usernameInput.value = '';
            }
        }
    }

    showLobbyAsGuest() {
        console.log('showLobbyAsGuest 호출됨');
        console.log('현재 authScreen:', this.authScreen);
        console.log('현재 lobbyScreen:', this.lobbyScreen);
        
        this.currentUser = null;
        this.currentUserId = null;
        // 로그아웃 상태로 표시
        this.accessToken = null;
        localStorage.removeItem('access_token');
        
        console.log('게스트 상태 설정 완료, 로비 표시 시작...');
        
        // 강제로 화면 전환 (checkAuth와의 타이밍 문제 방지)
        if (this.authScreen && this.lobbyScreen && this.meetingScreen) {
            this.authScreen.classList.add('hidden');
            this.lobbyScreen.classList.remove('hidden');
            this.meetingScreen.classList.add('hidden');
            
            console.log('게스트 모드 - 화면 전환 완료');
            console.log('lobbyScreen classes (after):', this.lobbyScreen.className);
            console.log('lobbyScreen display (after):', window.getComputedStyle(this.lobbyScreen).display);
        }
        
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
            console.log('✅ Socket.io 서버에 연결되었습니다:', this.socket.id);
            console.log('Socket URL:', this.socket.io.uri);
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket.io 연결 오류:', error);
        });

        this.socket.on('connected', (data) => {
            console.log('✅ 연결 확인:', data);
        });
        
        this.socket.on('disconnect', (reason) => {
            console.warn('⚠️ Socket.io 연결 해제:', reason);
        });

        this.socket.on('user-joined', async (data) => {
            console.log('👤 새 사용자 참가:', data);
            // 사용자 정보 저장 (username 포함)
            this.remoteUsers[data.sid] = {
                sid: data.sid,
                username: data.username || `User ${data.sid.substring(0, 8)}`
            };
            console.log('피어 연결 생성 시작 (user-joined):', data.sid);
            await this.createPeerConnection(data.sid, true);
            // 참가자 목록 업데이트
            this.updateParticipantsList();
        });

        this.socket.on('existing-users', async (data) => {
            console.log('👥 기존 사용자들 수신:', data);
            console.log('기존 사용자 수:', data.users?.length || 0);
            console.log('현재 Socket ID:', this.socket.id);
            console.log('로컬 스트림 상태:', !!this.localStream);
            
            if (!data.users || data.users.length === 0) {
                console.log('⚠️ 기존 사용자가 없습니다 (첫 번째 참가자)');
                // 참가자 목록 업데이트 (자신만)
                this.updateParticipantsList();
                return;
            }
            
            // 로컬 스트림이 준비될 때까지 약간 대기
            if (!this.localStream) {
                console.log('로컬 스트림 대기 중...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // 사용자 정보 저장
            if (!this.remoteUsers) {
                this.remoteUsers = {};
            }
            
            for (const user of data.users) {
                if (user.sid && user.sid !== this.socket.id) {
                    console.log(`🔗 기존 사용자와 연결 생성 시작: ${user.sid} (${user.username || '이름 없음'})`);
                    // 사용자 정보 저장
                    this.remoteUsers[user.sid] = {
                        sid: user.sid,
                        username: user.username || `User ${user.sid.substring(0, 8)}`
                    };
                    await this.createPeerConnection(user.sid, true);
                } else {
                    console.log(`⏭️ 자신의 ID는 건너뜀: ${user.sid}`);
                }
            }
            // 참가자 목록 업데이트
            this.updateParticipantsList();
        });

        this.socket.on('user-left', (data) => {
            console.log('사용자 나감:', data);
            this.removeVideoElement(data.sid);
            if (this.peers[data.sid]) {
                this.peers[data.sid].close();
                delete this.peers[data.sid];
            }
            // 사용자 정보 제거
            if (this.remoteUsers && this.remoteUsers[data.sid]) {
                delete this.remoteUsers[data.sid];
            }
            // 참가자 목록 업데이트
            this.updateParticipantsList();
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
            console.log('Socket 초기화 시작...');
            await this.initializeSocket();
            console.log('Socket 초기화 완료:', this.socket.id);
        } else {
            console.log('Socket 이미 연결됨:', this.socket.id);
        }
        
        // Socket 연결 확인
        if (!this.socket.connected) {
            console.error('⚠️ Socket이 연결되지 않았습니다!');
            await new Promise((resolve) => {
                if (this.socket.connected) {
                    resolve();
                } else {
                    this.socket.once('connect', resolve);
                    setTimeout(() => {
                        if (!this.socket.connected) {
                            console.error('❌ Socket 연결 타임아웃');
                            resolve();
                        }
                    }, 5000);
                }
            });
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
        console.log('📤 방 참가 요청 전송:', {
            room_id: roomId,
            username: username,
            user_id: this.currentUserId,
            socket_id: this.socket.id
        });
        
        this.socket.emit('join_room', {
            room_id: roomId,
            username: username,
            user_id: this.currentUserId  // 로그인한 사용자 ID 전달 (게스트는 null)
        });
        
        console.log('✅ join_room 이벤트 전송 완료');

        // 화면 전환
        console.log('회의 참가 - 화면 전환 시작');
        console.log('lobbyScreen:', this.lobbyScreen);
        console.log('meetingScreen:', this.meetingScreen);
        
        // 기존 클래스 확인
        console.log('전환 전 - lobbyScreen classes:', this.lobbyScreen.className);
        console.log('전환 전 - meetingScreen classes:', this.meetingScreen.className);
        
        this.lobbyScreen.classList.add('hidden');
        this.meetingScreen.classList.remove('hidden');
        
        // authScreen도 확실히 숨김
        if (this.authScreen) {
            this.authScreen.classList.add('hidden');
        }
        
        console.log('화면 전환 완료');
        console.log('전환 후 - lobbyScreen classes:', this.lobbyScreen.className);
        console.log('전환 후 - meetingScreen classes:', this.meetingScreen.className);
        console.log('전환 후 - lobbyScreen display:', window.getComputedStyle(this.lobbyScreen).display);
        console.log('전환 후 - meetingScreen display:', window.getComputedStyle(this.meetingScreen).display);
        
        // 약간의 지연 후 다시 확인 (다른 함수가 덮어쓸 수 있음)
        setTimeout(() => {
            console.log('1초 후 상태 확인:');
            console.log('lobbyScreen classes:', this.lobbyScreen.className);
            console.log('meetingScreen classes:', this.meetingScreen.className);
            console.log('lobbyScreen display:', window.getComputedStyle(this.lobbyScreen).display);
            console.log('meetingScreen display:', window.getComputedStyle(this.meetingScreen).display);
        }, 1000);
        
        if (this.currentUsernameDisplay) {
            this.currentUsernameDisplay.textContent = username;
        }
        if (this.roomIdDisplay) {
            this.roomIdDisplay.textContent = `방 ID: ${roomId}`;
        }
        
        // 참가자 목록 초기 업데이트
        setTimeout(() => {
            this.updateParticipantsList();
        }, 1000);
    }

    async createPeerConnection(targetSid, isInitiator) {
        if (this.peers[targetSid]) {
            console.log('이미 피어 연결이 존재합니다:', targetSid);
            // 기존 연결이 실패 상태면 재생성
            if (this.peers[targetSid].connectionState === 'failed' || 
                this.peers[targetSid].iceConnectionState === 'failed') {
                console.log('실패한 연결 제거 후 재생성:', targetSid);
                this.peers[targetSid].close();
                delete this.peers[targetSid];
            } else {
                return;
            }
        }
        
        // 로컬 스트림이 없으면 대기
        if (!this.localStream) {
            console.warn('로컬 스트림이 없어 피어 연결을 생성할 수 없습니다:', targetSid);
            // 로컬 스트림이 준비될 때까지 대기
            setTimeout(() => {
                if (this.localStream) {
                    this.createPeerConnection(targetSid, isInitiator);
                }
            }, 1000);
            return;
        }

        console.log(`피어 연결 생성: ${targetSid}, Initiator: ${isInitiator}`);

        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        const peerConnection = new RTCPeerConnection(configuration);
        this.peers[targetSid] = peerConnection;

        // 로컬 스트림 추가
        try {
            this.localStream.getTracks().forEach(track => {
                console.log(`트랙 추가: ${track.kind}`, track);
                peerConnection.addTrack(track, this.localStream);
            });
        } catch (error) {
            console.error('트랙 추가 실패:', error);
        }

        // 원격 스트림 처리
        peerConnection.ontrack = (event) => {
            console.log('🎥 원격 스트림 수신 이벤트:', targetSid, event);
            console.log('스트림 정보:', {
                streams: event.streams,
                track: event.track,
                trackKind: event.track?.kind,
                trackId: event.track?.id,
                trackReadyState: event.track?.readyState
            });
            
            // 스트림 추출
            let remoteStream = null;
            if (event.streams && event.streams.length > 0) {
                remoteStream = event.streams[0];
                console.log('스트림에서 추출:', remoteStream.id, remoteStream.getTracks());
            } else if (event.track) {
                remoteStream = new MediaStream([event.track]);
                console.log('트랙에서 새 스트림 생성:', remoteStream.id);
            } else {
                console.error('스트림이나 트랙을 찾을 수 없음');
                return;
            }
            
            // 저장된 사용자 이름 사용
            let username = `User ${targetSid.substring(0, 8)}`;
            if (this.remoteUsers && this.remoteUsers[targetSid]) {
                username = this.remoteUsers[targetSid].username;
            }
            
            console.log(`✅ 원격 비디오 추가: ${targetSid} (${username})`);
            console.log('비디오 그리드:', this.videoGrid);
            this.addVideoElement(targetSid, remoteStream, username, false);
            
            // 비디오 트랙 확인
            const videoTracks = remoteStream.getVideoTracks();
            const audioTracks = remoteStream.getAudioTracks();
            console.log('비디오 트랙 수:', videoTracks.length, '오디오 트랙 수:', audioTracks.length);
            
            if (videoTracks.length > 0) {
                console.log('✅ 비디오 트랙 수신됨:', targetSid, videoTracks[0].id);
            }
            if (audioTracks.length > 0) {
                console.log('✅ 오디오 트랙 수신됨:', targetSid, audioTracks[0].id);
            }
        };

        // ICE Candidate 처리
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`ICE Candidate 전송: ${targetSid}`, event.candidate);
                this.socket.emit('ice_candidate', {
                    target: targetSid,
                    candidate: event.candidate
                });
            } else {
                console.log(`ICE Candidate 수집 완료: ${targetSid}`);
            }
        };
        
        // ICE 연결 상태 변경
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`ICE 연결 상태 (${targetSid}):`, peerConnection.iceConnectionState);
            if (peerConnection.iceConnectionState === 'failed') {
                console.warn(`ICE 연결 실패: ${targetSid}, 재시도 중...`);
                // 재연결 시도
                setTimeout(() => {
                    if (this.peers[targetSid] && this.peers[targetSid].iceConnectionState === 'failed') {
                        console.log(`재연결 시도: ${targetSid}`);
                        this.createPeerConnection(targetSid, true);
                    }
                }, 2000);
            }
        };

        // 연결 상태 변경
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            console.log(`연결 상태 (${targetSid}):`, state);
            
            if (state === 'connected') {
                console.log(`✅ 연결 성공: ${targetSid}`);
                // 참가자 목록 업데이트
                this.updateParticipantsList();
            } else if (state === 'failed' || state === 'disconnected') {
                console.warn(`⚠️ 연결 실패/해제: ${targetSid}, 상태: ${state}`);
                // 실패한 연결 정리
                if (state === 'failed') {
                    setTimeout(() => {
                        if (this.peers[targetSid] && 
                            this.peers[targetSid].connectionState === 'failed') {
                            console.log(`재연결 시도: ${targetSid}`);
                            this.peers[targetSid].close();
                            delete this.peers[targetSid];
                            this.createPeerConnection(targetSid, true);
                        }
                    }, 3000);
                }
            }
        };
        
        // 시그널링 상태 변경
        peerConnection.onsignalingstatechange = () => {
            console.log(`시그널링 상태 (${targetSid}):`, peerConnection.signalingState);
        };

        // Offer 생성 및 전송
        if (isInitiator) {
            try {
                // 약간의 지연을 두어 트랙이 완전히 추가되도록 함
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const offer = await peerConnection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await peerConnection.setLocalDescription(offer);
                console.log(`Offer 전송: ${targetSid}`, offer);
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
        console.log(`Offer 수신: ${data.from}`, data.offer);
        
        let peerConnection = this.peers[data.from];
        if (!peerConnection) {
            console.log(`피어 연결이 없어 생성: ${data.from}`);
            await this.createPeerConnection(data.from, false);
            peerConnection = this.peers[data.from];
        }

        if (!peerConnection) {
            console.error(`피어 연결 생성 실패: ${data.from}`);
            return;
        }

        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await peerConnection.setLocalDescription(answer);
            console.log(`Answer 전송: ${data.from}`, answer);
            this.socket.emit('answer', {
                target: data.from,
                answer: answer
            });
        } catch (error) {
            console.error('Answer 생성 실패:', error);
        }
    }

    async handleAnswer(data) {
        console.log(`Answer 수신: ${data.from}`, data.answer);
        const peerConnection = this.peers[data.from];
        if (peerConnection) {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                console.log(`Answer 설정 성공: ${data.from}`);
            } catch (error) {
                console.error('Answer 설정 실패:', error);
            }
        } else {
            console.warn(`피어 연결이 없어 Answer를 설정할 수 없음: ${data.from}`);
        }
    }

    async handleIceCandidate(data) {
        const peerConnection = this.peers[data.from];
        if (peerConnection && data.candidate) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log(`ICE Candidate 추가 성공: ${data.from}`);
            } catch (error) {
                // null candidate는 무시 (정상)
                if (data.candidate && data.candidate.candidate) {
                    console.error('ICE Candidate 추가 실패:', error, data.candidate);
                }
            }
        } else if (!peerConnection) {
            console.warn(`피어 연결이 없어 ICE Candidate를 추가할 수 없음: ${data.from}`);
        }
    }

    addVideoElement(sid, stream, username, isLocal) {
        console.log(`📹 비디오 요소 추가: ${sid} (${username}), 로컬: ${isLocal}`);
        console.log('스트림 정보:', {
            id: stream.id,
            active: stream.active,
            videoTracks: stream.getVideoTracks().length,
            audioTracks: stream.getAudioTracks().length
        });
        
        // videoGrid 확인
        if (!this.videoGrid) {
            console.error('videoGrid를 찾을 수 없습니다!');
            this.videoGrid = document.getElementById('video-grid');
            if (!this.videoGrid) {
                console.error('video-grid 요소를 찾을 수 없습니다!');
                return;
            }
        }
        
        // 기존 요소 제거
        const existing = document.getElementById(`video-${sid}`);
        if (existing) {
            console.log('기존 비디오 요소 제거:', sid);
            existing.remove();
        }

        const videoWrapper = document.createElement('div');
        videoWrapper.id = `video-${sid}`;
        videoWrapper.className = 'video-wrapper';
        if (isLocal) {
            videoWrapper.classList.add('local');
        }

        const video = document.createElement('video');
        video.id = `video-player-${sid}`;
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = isLocal; // 로컬 비디오는 음소거

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
        console.log('✅ 비디오 요소가 video-grid에 추가됨');

        // 비디오 이벤트 리스너
        video.onloadedmetadata = () => {
            console.log(`비디오 메타데이터 로드됨: ${sid}`, {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
            });
            video.play().catch(err => console.error(`비디오 재생 실패 (${sid}):`, err));
        };
        
        video.onplay = () => {
            console.log(`✅ 비디오 재생 시작: ${sid}`);
        };
        
        video.onerror = (error) => {
            console.error(`비디오 오류 (${sid}):`, error);
        };
        
        // 트랙 이벤트 리스너
        stream.getTracks().forEach(track => {
            track.onended = () => {
                console.log(`트랙 종료: ${sid} - ${track.kind}`);
            };
            track.onmute = () => {
                console.log(`트랙 음소거: ${sid} - ${track.kind}`);
            };
            track.onunmute = () => {
                console.log(`트랙 음소거 해제: ${sid} - ${track.kind}`);
            };
        });
        
        // 즉시 재생 시도
        video.play().catch(err => {
            console.warn(`즉시 재생 실패 (${sid}), 메타데이터 로드 대기 중:`, err);
        });
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
        // 채팅 열리면 참가자 목록 닫기
        if (!this.chatSidebar.classList.contains('hidden') && this.participantsSidebar) {
            this.participantsSidebar.classList.add('hidden');
        }
    }
    
    toggleParticipants() {
        if (!this.participantsSidebar) return;
        this.participantsSidebar.classList.toggle('hidden');
        if (this.participantsBtn) {
            this.participantsBtn.classList.toggle('active', !this.participantsSidebar.classList.contains('hidden'));
        }
        // 참가자 목록 열리면 채팅 닫기
        if (!this.participantsSidebar.classList.contains('hidden') && this.chatSidebar) {
            this.chatSidebar.classList.add('hidden');
        }
        // 참가자 목록 업데이트
        this.updateParticipantsList();
    }
    
    updateParticipantsList() {
        if (!this.participantsList) return;
        
        // 목록 초기화
        this.participantsList.innerHTML = '';
        
        // 자신 추가
        if (this.currentUsername) {
            const localItem = this.createParticipantItem(
                this.currentUsername,
                this.socket?.id,
                true,
                'connected'
            );
            this.participantsList.appendChild(localItem);
        }
        
        // 원격 사용자들 추가
        if (this.peers) {
            Object.keys(this.peers).forEach(sid => {
                if (sid !== this.socket?.id) {
                    const username = this.remoteUsers[sid]?.username || `User ${sid.substring(0, 8)}`;
                    const peerConnection = this.peers[sid];
                    const connectionState = peerConnection?.connectionState || 'unknown';
                    const iceConnectionState = peerConnection?.iceConnectionState || 'unknown';
                    
                    let status = 'connecting';
                    if (connectionState === 'connected' && iceConnectionState === 'connected') {
                        status = 'connected';
                    } else if (connectionState === 'failed' || iceConnectionState === 'failed') {
                        status = 'disconnected';
                    }
                    
                    const item = this.createParticipantItem(username, sid, false, status);
                    this.participantsList.appendChild(item);
                }
            });
        }
        
        // 참가자 수 업데이트
        const totalCount = (this.peers ? Object.keys(this.peers).length : 0) + (this.currentUsername ? 1 : 0);
        if (this.participantsCount) {
            this.participantsCount.textContent = totalCount;
        }
    }
    
    createParticipantItem(username, sid, isLocal, status) {
        const item = document.createElement('div');
        item.className = `participant-item ${isLocal ? 'local' : ''}`;
        
        const statusIndicator = document.createElement('div');
        statusIndicator.className = `participant-status ${status}`;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'participant-name';
        nameDiv.textContent = isLocal ? `${username} (나)` : username;
        
        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'participant-indicator';
        if (status === 'connected') {
            indicatorDiv.textContent = '🟢';
        } else if (status === 'connecting') {
            indicatorDiv.textContent = '🟡 연결 중...';
        } else {
            indicatorDiv.textContent = '🔴 연결 끊김';
        }
        
        item.appendChild(statusIndicator);
        item.appendChild(nameDiv);
        item.appendChild(indicatorDiv);
        
        return item;
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

// Service Worker 등록 (일시적으로 비활성화 - Socket.io CORS 문제 해결)
if ('serviceWorker' in navigator) {
    // 기존 Service Worker 제거
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
            registration.unregister().then((success) => {
                if (success) {
                    console.log('기존 Service Worker 제거됨');
                }
            });
        }
    });
    
    // Service Worker 등록 비활성화 (Socket.io CORS 문제로 인해)
    // 필요시 다시 활성화 가능
    /*
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker 등록 성공:', registration.scope);
            })
            .catch((error) => {
                console.warn('Service Worker 등록 실패:', error);
            });
    });
    */
    console.log('Service Worker 비활성화됨 (Socket.io CORS 문제 해결)');
}

// 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 애플리케이션 초기화 시작...');
    console.log('API_BASE_URL:', window.API_BASE_URL);
    console.log('SOCKET_SERVER_URL:', window.SOCKET_SERVER_URL);
    
    try {
        window.zoomClone = new ZoomClone();
        console.log('ZOOM 클론 애플리케이션이 시작되었습니다');
    } catch (error) {
        console.error('애플리케이션 초기화 실패:', error);
    }
});

