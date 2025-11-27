"""
ZOOM 클론 - FastAPI 백엔드 서버
WebRTC 시그널링 및 Socket.io 통신 처리
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, UploadFile, File, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import socketio
import uvicorn
import json
import os
import shutil
import uuid
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from pathlib import Path
from database import init_db, get_db, User, SessionLocal, Meeting, MeetingParticipant, MeetingEvent
from auth import (
    authenticate_user, 
    create_user, 
    create_access_token, 
    verify_token,
    get_user_by_username,
    get_user_by_email,
    get_user_by_id
)

# FastAPI 앱 생성
app = FastAPI(title="ZOOM Clone")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.io 서버 생성
sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode='asgi')
# FastAPI 앱에 Socket.io 마운트
app.mount("/socket.io", socketio.ASGIApp(sio))
# Socket.io가 포함된 앱 (하위 호환성을 위해 유지)
socket_app = socketio.ASGIApp(sio, app)

# favicon.ico를 정적 파일로 제공 (없으면 빈 응답) - 정적 파일 마운트 전에 정의
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Favicon (404 방지)"""
    favicon_path = Path("static/favicon.ico")
    if favicon_path.exists():
        return FileResponse("static/favicon.ico", media_type="image/x-icon")
    else:
        # favicon이 없으면 빈 응답 반환
        return Response(content=b"", status_code=200, media_type="image/x-icon")

# 정적 파일 서빙
app.mount("/static", StaticFiles(directory="static"), name="static")

# 데이터베이스 초기화
print(f"[DEBUG] 애플리케이션 시작: 데이터베이스 초기화 중...")
try:
    init_db()
    print(f"[DEBUG] 데이터베이스 초기화 완료")
except Exception as e:
    print(f"[ERROR] 데이터베이스 초기화 실패: {e}")
    import traceback
    print(f"[ERROR] 상세 오류:\n{traceback.format_exc()}")

# 회의실 및 사용자 관리
rooms: Dict[str, Dict] = {}
users: Dict[str, Dict] = {}

# 파일 공유 디렉토리 설정
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# 파일 정보 저장 (메모리 기반, 실제로는 DB 사용 권장)
shared_files: Dict[str, Dict] = {}

@app.get("/")
async def read_root():
    """메인 페이지"""
    return FileResponse("static/index.html")

@app.get("/static/manifest.json")
async def get_manifest():
    """PWA 매니페스트"""
    return FileResponse("static/manifest.json", media_type="application/json")

@app.get("/static/sw.js")
async def get_service_worker():
    """Service Worker"""
    return FileResponse("static/sw.js", media_type="application/javascript")

@app.get("/health")
async def health_check():
    """헬스 체크"""
    print(f"[DEBUG] Health check 요청: {datetime.now().isoformat()}")
    print(f"[DEBUG] 현재 상태 - 방 개수: {len(rooms)}, 연결된 사용자 수: {len(users)}")
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# 인증 API
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@app.post("/api/register", response_model=TokenResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """회원가입"""
    print(f"[DEBUG] ===== 회원가입 요청 =====")
    print(f"[DEBUG] username={user_data.username}, email={user_data.email}")
    
    # 사용자명 중복 확인
    if get_user_by_username(db, user_data.username):
        print(f"[WARNING] 사용자명 중복: {user_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 사용자명입니다"
        )
    
    # 이메일 중복 확인
    if get_user_by_email(db, user_data.email):
        print(f"[WARNING] 이메일 중복: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 이메일입니다"
        )
    
    # 비밀번호 길이 검증
    if len(user_data.password) < 6:
        print(f"[WARNING] 비밀번호 길이 부족: {len(user_data.password)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호는 최소 6자 이상이어야 합니다"
        )
    
    # 사용자 생성
    try:
        print(f"[DEBUG] 사용자 생성 중...")
        db_user = create_user(
            db=db,
            username=user_data.username,
            email=user_data.email,
            password=user_data.password
        )
        print(f"[DEBUG] 사용자 생성 완료: user_id={db_user.id}")
        
        # JWT 토큰 생성
        access_token = create_access_token(data={"sub": db_user.username, "user_id": db_user.id})
        print(f"[DEBUG] JWT 토큰 생성 완료")
        
        print(f"[DEBUG] ===== 회원가입 완료 =====")
        return TokenResponse(
            access_token=access_token,
            user={
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email
            }
        )
    except Exception as e:
        print(f"[ERROR] 회원가입 중 오류: {e}")
        import traceback
        print(f"[ERROR] 상세 오류:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원가입 중 오류가 발생했습니다: {str(e)}"
        )


# 구버전 프론트엔드 호환용 엔드포인트 (/api/auth/register → /api/register)
@app.post("/api/auth/register", response_model=TokenResponse)
async def register_compat(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    이전 프론트엔드에서 사용하던 /api/auth/register 경로를
    현재 /api/register 구현과 동일하게 동작하도록 래핑.
    """
    return await register(user_data, db)

@app.post("/api/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """로그인"""
    print(f"[DEBUG] ===== 로그인 요청 =====")
    print(f"[DEBUG] username={user_data.username}")
    
    # 사용자 인증
    user = authenticate_user(db, user_data.username, user_data.password)
    if not user:
        print(f"[WARNING] 로그인 실패: 사용자명 또는 비밀번호 오류")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자명 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"[DEBUG] 사용자 인증 성공: user_id={user.id}, username={user.username}")
    
    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.username, "user_id": user.id})
    print(f"[DEBUG] JWT 토큰 생성 완료")
    print(f"[DEBUG] ===== 로그인 완료 =====")
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    )


# 구버전 프론트엔드 호환용 엔드포인트 (/api/auth/login → /api/login)
@app.post("/api/auth/login", response_model=TokenResponse)
async def login_compat(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    이전 프론트엔드에서 사용하던 /api/auth/login 경로를
    현재 /api/login 구현과 동일하게 동작하도록 래핑.
    """
    return await login(user_data, db)

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """현재 사용자 조회 (의존성)"""
    if not authorization:
        print(f"[WARNING] 인증 토큰 없음")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 필요합니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # "Bearer " 접두사 제거
    try:
        token = authorization.replace("Bearer ", "")
    except:
        print(f"[WARNING] 잘못된 인증 형식: {authorization[:20]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="잘못된 인증 형식입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 토큰 검증
    payload = verify_token(token)
    if payload is None:
        print(f"[WARNING] 토큰 검증 실패")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username: str = payload.get("sub")
    user_id: int = payload.get("user_id")
    if username is None or user_id is None:
        print(f"[WARNING] 토큰 페이로드 불완전: username={username}, user_id={user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"[DEBUG] 토큰 검증 성공: username={username}, user_id={user_id}")
    
    user = get_user_by_id(db, user_id)
    if user is None:
        print(f"[WARNING] 사용자 찾을 수 없음: user_id={user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@app.get("/api/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 조회"""
    print(f"[DEBUG] 사용자 정보 조회: user_id={current_user.id}, username={current_user.username}")
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None
    }

@app.get("/api/meetings")
async def get_meetings(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자가 참가한 회의 목록 조회"""
    print(f"[DEBUG] 회의 목록 조회 요청: user_id={current_user.id}, skip={skip}, limit={limit}")
    
    # 사용자가 참가한 회의 조회
    meetings = db.query(Meeting).join(MeetingParticipant).filter(
        MeetingParticipant.user_id == current_user.id
    ).order_by(Meeting.started_at.desc()).offset(skip).limit(limit).all()
    
    print(f"[DEBUG] 조회된 회의 수: {len(meetings)}")
    
    result = []
    for meeting in meetings:
        participants = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == meeting.id
        ).all()
        
        result.append({
            "id": meeting.id,
            "room_id": meeting.room_id,
            "title": meeting.title,
            "started_at": meeting.started_at.isoformat() if meeting.started_at else None,
            "ended_at": meeting.ended_at.isoformat() if meeting.ended_at else None,
            "duration_seconds": meeting.duration_seconds,
            "is_active": meeting.is_active,
            "participant_count": len(participants)
        })
    
    print(f"[DEBUG] 회의 목록 반환: total={len(result)}")
    return {"meetings": result, "total": len(result)}

@app.get("/api/meetings/{meeting_id}/timeline")
async def get_meeting_timeline(
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """회의 타임라인 조회"""
    print(f"[DEBUG] 타임라인 조회 요청: meeting_id={meeting_id}, user_id={current_user.id}")
    
    # 회의 존재 확인 및 권한 확인
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        print(f"[WARNING] 회의를 찾을 수 없음: meeting_id={meeting_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="회의를 찾을 수 없습니다"
        )
    
    print(f"[DEBUG] 회의 찾음: room_id={meeting.room_id}, is_active={meeting.is_active}")
    
    # 참가자 확인 (권한 체크)
    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.user_id == current_user.id
    ).first()
    
    if not participant and meeting.created_by != current_user.id:
        print(f"[WARNING] 접근 권한 없음: user_id={current_user.id}, meeting_id={meeting_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 회의에 대한 접근 권한이 없습니다"
        )
    
    # 회의 정보
    participants = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id
    ).all()
    
    # 타임라인 이벤트 조회
    events = db.query(MeetingEvent).filter(
        MeetingEvent.meeting_id == meeting_id
    ).order_by(MeetingEvent.timestamp.asc()).all()
    
    print(f"[DEBUG] 타임라인 데이터: 참가자 수={len(participants)}, 이벤트 수={len(events)}")
    
    # 이벤트 포맷팅
    timeline_events = []
    for event in events:
        timeline_events.append({
            "id": event.id,
            "type": event.event_type,
            "username": event.username,
            "timestamp": event.timestamp.isoformat() if event.timestamp else None,
            "message": event.message,
            "data": event.data
        })
    
    return {
        "meeting": {
            "id": meeting.id,
            "room_id": meeting.room_id,
            "title": meeting.title,
            "started_at": meeting.started_at.isoformat() if meeting.started_at else None,
            "ended_at": meeting.ended_at.isoformat() if meeting.ended_at else None,
            "duration_seconds": meeting.duration_seconds,
            "is_active": meeting.is_active
        },
        "participants": [
            {
                "id": p.id,
                "username": p.username,
                "joined_at": p.joined_at.isoformat() if p.joined_at else None,
                "left_at": p.left_at.isoformat() if p.left_at else None,
                "duration_seconds": p.duration_seconds
            }
            for p in participants
        ],
        "timeline": timeline_events
    }

@app.get("/api/meetings/room/{room_id}/timeline")
async def get_meeting_timeline_by_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """회의실 ID로 타임라인 조회"""
    meeting = db.query(Meeting).filter(Meeting.room_id == room_id).order_by(Meeting.started_at.desc()).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="회의를 찾을 수 없습니다"
        )
    
    return await get_meeting_timeline(meeting.id, current_user, db)

# Socket.io 이벤트 핸들러
@sio.event
async def connect(sid, environ):
    """클라이언트 연결"""
    client_ip = environ.get("REMOTE_ADDR", "unknown")
    print(f"[DEBUG] 클라이언트 연결: sid={sid}, ip={client_ip}")
    print(f"[DEBUG] 현재 연결된 사용자 수: {len(users)}")
    await sio.emit("connected", {"sid": sid}, room=sid)

@sio.event
async def disconnect(sid):
    """클라이언트 연결 해제"""
    print(f"[DEBUG] 클라이언트 연결 해제 시작: sid={sid}")
    # 사용자가 속한 방에서 제거
        if sid in users:
        user = users[sid]
        room_id = user.get("room_id")
        username = user.get("username")
        user_id = user.get("user_id")
        
        print(f"[DEBUG] 사용자 정보: username={username}, room_id={room_id}, user_id={user_id}")
        
        # 대기 목록에서 제거 (방 없는 연결인 경우)
        if username in waiting_users:
            del waiting_users[username]
            print(f"[DEBUG] 대기 목록에서 제거: {username}")
        
        # 방 없는 직접 연결인 경우
        if not room_id:
            print(f"[DEBUG] 방 없는 직접 연결 종료")
            # WebRTC 피어 연결은 클라이언트에서 처리
        else:
            # 기존 방 기반 연결 처리
            db = SessionLocal()
            try:
                if room_id in rooms:
                print(f"[DEBUG] 방 {room_id}에서 사용자 제거 중...")
                print(f"[DEBUG] 방 {room_id} 현재 사용자 수: {len(rooms[room_id].get('users', []))}")
                
                if sid in rooms[room_id].get("users", []):
                    rooms[room_id]["users"].remove(sid)
                    print(f"[DEBUG] 사용자 제거 완료. 남은 사용자 수: {len(rooms[room_id]['users'])}")
                
                # 데이터베이스에 나감 이벤트 기록
                meeting_id = rooms[room_id].get("db_id")
                print(f"[DEBUG] Meeting ID: {meeting_id}")
                
                if meeting_id:
                    # 참가자 정보 업데이트
                    participant = db.query(MeetingParticipant).filter(
                        MeetingParticipant.meeting_id == meeting_id,
                        MeetingParticipant.username == username
                    ).order_by(MeetingParticipant.joined_at.desc()).first()
                    
                    if participant:
                        print(f"[DEBUG] 참가자 정보 찾음: participant_id={participant.id}")
                        if not participant.left_at:
                            participant.left_at = datetime.utcnow()
                            if participant.joined_at:
                                duration = (datetime.utcnow() - participant.joined_at).total_seconds()
                                participant.duration_seconds = int(duration)
                                print(f"[DEBUG] 참가자 참가 시간: {duration:.2f}초")
                    else:
                        print(f"[WARNING] 참가자 정보를 찾을 수 없음: username={username}, meeting_id={meeting_id}")
                    
                    # 나감 이벤트 기록
                    event = MeetingEvent(
                        meeting_id=meeting_id,
                        event_type="user_leave",
                        user_id=user_id,
                        username=username,
                        timestamp=datetime.utcnow()
                    )
                    db.add(event)
                    print(f"[DEBUG] 나감 이벤트 기록 완료")
                    
                    # 방이 비어있으면 회의 종료 처리
                    # 주의: 메모리에서 방을 제거하지 않음 (같은 room_id로 재입장 시 같은 회의 사용을 위해)
                    if len(rooms[room_id]["users"]) == 0:
                        print(f"[DEBUG] 방이 비어있음. 회의 종료 처리 중...")
                        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
                        if meeting:
                            meeting.ended_at = datetime.utcnow()
                            meeting.is_active = False
                            if meeting.started_at:
                                duration = (datetime.utcnow() - meeting.started_at).total_seconds()
                                meeting.duration_seconds = int(duration)
                                print(f"[DEBUG] 회의 종료: duration={duration:.2f}초")
                            # 중요: 메모리에서 방을 제거하지 않음
                            # 같은 room_id로 재입장 시 같은 meeting_id를 사용하기 위해 유지
                            print(f"[DEBUG] 메모리 방 유지: 같은 room_id({room_id})로 재입장 시 같은 회의(meeting_id={meeting_id}) 사용")
                    
                    db.commit()
                    print(f"[DEBUG] 데이터베이스 커밋 완료")
                
                    await sio.emit("user-left", {"sid": sid, "username": username}, room=room_id)
                    print(f"[DEBUG] user-left 이벤트 전송 완료")
            except Exception as e:
                print(f"[ERROR] 연결 해제 중 오류: {e}")
                import traceback
                print(f"[ERROR] 상세 오류:\n{traceback.format_exc()}")
                db.rollback()
            finally:
                db.close()
        
        del users[sid]
        print(f"[DEBUG] 사용자 정보 삭제 완료. 현재 연결된 사용자 수: {len(users)}")
    else:
        print(f"[WARNING] 연결 해제: 사용자 정보를 찾을 수 없음 (sid={sid})")

# 대기 중인 사용자 목록 (방 없이 직접 연결용)
waiting_users: Dict[str, Dict] = {}  # {username: {sid, username, target_username}}

@sio.event
async def start_connection(sid, data):
    """방 없이 직접 연결 시작"""
    username = data.get("username", f"User_{sid[:8]}")
    target_username = data.get("target_username")  # None이면 자동 매칭
    
    print(f"[DEBUG] ===== 직접 연결 시작 =====")
    print(f"[DEBUG] sid={sid}, username={username}, target_username={target_username}")
    
    # 사용자 정보 저장
    users[sid] = {
        "sid": sid,
        "username": username,
        "room_id": None,  # 방 없음
        "user_id": None,
        "joined_at": datetime.now().isoformat(),
        "target_username": target_username
    }
    
    if target_username:
        # 특정 사용자에게 연결 시도
        print(f"[DEBUG] 특정 사용자 연결 시도: {target_username}")
        target_user = waiting_users.get(target_username)
        
        if target_user and target_user["sid"] != sid:
            # 대상 사용자 찾음 - 연결 시작
            target_sid = target_user["sid"]
            print(f"[DEBUG] 대상 사용자 찾음: {target_username} (sid={target_sid})")
            
            # 대기 목록에서 제거
            if target_username in waiting_users:
                del waiting_users[target_username]
            
            # 양쪽 사용자에게 매칭 알림
            # 먼저 연결한 사용자가 송신자 (is_sender=True)
            await sio.emit("user-matched", {
                "target_sid": target_sid,
                "target_username": target_username,
                "is_sender": True
            }, room=sid)
            
            await sio.emit("user-matched", {
                "target_sid": sid,
                "target_username": username,
                "is_sender": False
            }, room=target_sid)
            
            print(f"[DEBUG] 사용자 매칭 완료: {username} <-> {target_username}")
        else:
            # 대상 사용자를 찾을 수 없음 - 대기 목록에 추가
            print(f"[DEBUG] 대상 사용자를 찾을 수 없음. 대기 목록에 추가")
            waiting_users[username] = {
                "sid": sid,
                "username": username,
                "target_username": target_username
            }
            await sio.emit("connection-waiting", {
                "message": f"{target_username} 사용자를 기다리는 중..."
            }, room=sid)
    else:
        # 자동 매칭
        print(f"[DEBUG] 자동 매칭 시도")
        
        # 대기 중인 다른 사용자 찾기
        matched_user = None
        for waiting_username, waiting_user in waiting_users.items():
            # 자신이 아니고, 대상이 없거나 자신을 기다리는 사용자
            if (waiting_user["sid"] != sid and 
                (waiting_user["target_username"] is None or 
                 waiting_user["target_username"] == username)):
                matched_user = waiting_user
                break
        
        if matched_user:
            # 매칭된 사용자 찾음
            matched_sid = matched_user["sid"]
            matched_username = matched_user["username"]
            print(f"[DEBUG] 자동 매칭 성공: {username} <-> {matched_username}")
            
            # 대기 목록에서 제거
            if matched_username in waiting_users:
                del waiting_users[matched_username]
            
            # 양쪽 사용자에게 매칭 알림
            # 먼저 연결한 사용자가 송신자
            await sio.emit("user-matched", {
                "target_sid": matched_sid,
                "target_username": matched_username,
                "is_sender": True
            }, room=sid)
            
            await sio.emit("user-matched", {
                "target_sid": sid,
                "target_username": username,
                "is_sender": False
            }, room=matched_sid)
        else:
            # 매칭할 사용자 없음 - 대기 목록에 추가
            print(f"[DEBUG] 매칭할 사용자 없음. 대기 목록에 추가")
            waiting_users[username] = {
                "sid": sid,
                "username": username,
                "target_username": None
            }
            await sio.emit("connection-waiting", {
                "message": "다른 사용자를 기다리는 중..."
            }, room=sid)

@sio.event
async def join_room(sid, data):
    """회의실 참가"""
    room_id = data.get("room_id")
    username = data.get("username", f"User_{sid[:8]}")
    user_id = data.get("user_id")  # 로그인한 사용자의 ID (선택사항)
    
    print(f"[DEBUG] ===== 회의실 참가 요청 =====")
    print(f"[DEBUG] sid={sid}, username={username}, room_id={room_id}, user_id={user_id}")
    print(f"[DEBUG] 현재 메모리 방 개수: {len(rooms)}")
    print(f"[DEBUG] 현재 연결된 사용자 수: {len(users)}")
    
    if not room_id:
        print(f"[ERROR] 방 ID가 없음")
        await sio.emit("error", {"message": "방 ID가 필요합니다"}, room=sid)
        return
    
    db = SessionLocal()
    try:
        # ===== 핵심: DB를 기준으로 항상 같은 회의를 사용 =====
        # 같은 room_id면 무조건 같은 meeting을 사용하도록 DB를 먼저 확인
        meeting = db.query(Meeting).filter(Meeting.room_id == room_id).order_by(Meeting.started_at.desc()).first()
        
        if meeting:
            print(f"[DEBUG] DB에서 기존 회의 찾음: meeting_id={meeting.id}, is_active={meeting.is_active}")
            print(f"[DEBUG] 같은 회의실 ID({room_id})는 항상 같은 회의(meeting_id={meeting.id})를 사용합니다")
            
            # DB 회의가 비활성인 경우 재활성화 (같은 회의를 계속 사용)
            if not meeting.is_active:
                print(f"[DEBUG] 비활성 회의 재활성화 중... (같은 회의 유지)")
                meeting.is_active = True
                # ended_at이 있으면 None으로 설정 (회의 재개)
                if meeting.ended_at:
                    meeting.ended_at = None
                # started_at은 유지 (원래 시작 시간 보존)
                db.commit()
                print(f"[DEBUG] 회의 재활성화 완료: meeting_id={meeting.id}")
        else:
            # DB에 회의가 없으면 새로 생성
            print(f"[DEBUG] DB에 회의 없음. 새 회의 생성 중...")
            meeting = Meeting(
                room_id=room_id,
                created_by=user_id,
                started_at=datetime.utcnow(),
                is_active=True
            )
            db.add(meeting)
            db.commit()
            db.refresh(meeting)
            print(f"[DEBUG] 새 회의 생성 완료: meeting_id={meeting.id}, room_id={room_id}")
        
        # 메모리 상태 확인 및 동기화
        # 메모리에 방이 없으면 생성 (DB 회의를 기준으로)
        if room_id not in rooms:
            print(f"[DEBUG] 메모리에 방 없음. DB 회의 기준으로 방 생성 중...")
            rooms[room_id] = {
                "id": room_id,
                "users": [],
                "created_at": datetime.now().isoformat(),
                "db_id": meeting.id  # DB 회의 ID 사용
            }
            print(f"[DEBUG] 메모리에 방 생성 완료: room_id={room_id}, db_id={meeting.id}")
        else:
            # 메모리에 방이 있으면 DB 회의 ID와 동기화 확인
            existing_db_id = rooms[room_id].get("db_id")
            if existing_db_id != meeting.id:
                print(f"[WARNING] 메모리 방의 db_id({existing_db_id})와 DB 회의 ID({meeting.id}) 불일치. 동기화 중...")
                rooms[room_id]["db_id"] = meeting.id
                print(f"[DEBUG] 동기화 완료: db_id={meeting.id}")
            else:
                print(f"[DEBUG] 메모리 방과 DB 회의 동기화 확인: db_id={meeting.id}")
            print(f"[DEBUG] 메모리 방 정보: users={len(rooms[room_id].get('users', []))}, db_id={rooms[room_id].get('db_id')}")
        
        # 사용자 정보 저장
        users[sid] = {
            "sid": sid,
            "username": username,
            "room_id": room_id,
            "user_id": user_id,
            "joined_at": datetime.now().isoformat()
        }
        print(f"[DEBUG] 사용자 정보 저장 완료")
        
        # 방에 사용자 추가
        if sid not in rooms[room_id]["users"]:
            rooms[room_id]["users"].append(sid)
            print(f"[DEBUG] 방에 사용자 추가 완료. 현재 방 사용자 수: {len(rooms[room_id]['users'])}")
        else:
            print(f"[WARNING] 사용자가 이미 방에 존재함")
        
        await sio.enter_room(sid, room_id)
        print(f"[DEBUG] Socket.io 방 입장 완료")
        
        # 데이터베이스에 참가자 기록 (meeting은 항상 존재함)
        participant = MeetingParticipant(
            meeting_id=meeting.id,
            user_id=user_id,
            username=username,
            joined_at=datetime.utcnow()
        )
        db.add(participant)
        print(f"[DEBUG] 참가자 정보 DB 저장 중...")
        
        # 참가 이벤트 기록
        event = MeetingEvent(
            meeting_id=meeting.id,
            event_type="user_join",
            user_id=user_id,
            username=username,
            timestamp=datetime.utcnow()
        )
        db.add(event)
        db.commit()
        print(f"[DEBUG] 참가 이벤트 기록 완료. DB 커밋 완료")
        
        # 기존 사용자들에게 새 사용자 알림
        await sio.emit("user-joined", {
            "sid": sid,
            "username": username
        }, room=room_id, skip_sid=sid)
        print(f"[DEBUG] user-joined 이벤트 전송 완료")
        
        # 새 사용자에게 기존 사용자 목록 전송
        existing_users = [
            {"sid": uid, "username": users[uid].get("username")}
            for uid in rooms[room_id]["users"] if uid != sid and uid in users
        ]
        await sio.emit("existing-users", {"users": existing_users}, room=sid)
        print(f"[DEBUG] existing-users 이벤트 전송 완료. 기존 사용자 수: {len(existing_users)}")
        
        print(f"[DEBUG] ===== 회의실 참가 완료 =====")
        print(f"사용자 {username} ({sid})가 방 {room_id}에 참가했습니다")
    except Exception as e:
        print(f"[ERROR] 회의 참가 중 오류 발생: {e}")
        import traceback
        print(f"[ERROR] 상세 오류:\n{traceback.format_exc()}")
        await sio.emit("error", {"message": f"회의 참가 실패: {str(e)}"}, room=sid)
        db.rollback()
    finally:
        db.close()

@sio.event
async def offer(sid, data):
    """WebRTC Offer 전송 (방 없이 직접 전송)"""
    target_sid = data.get("target")
    offer = data.get("offer")
    
    print(f"[DEBUG] WebRTC Offer: {sid} -> {target_sid}")
    
    if target_sid and offer:
        # 방 없이 직접 전송
        await sio.emit("offer", {
            "offer": offer,
            "from": sid
        }, room=target_sid)
        print(f"[DEBUG] Offer 전송 완료: {sid} -> {target_sid}")
    else:
        print(f"[WARNING] Offer 전송 실패: target_sid={target_sid}, offer 존재={offer is not None}")

@sio.event
async def answer(sid, data):
    """WebRTC Answer 전송 (방 없이 직접 전송)"""
    target_sid = data.get("target")
    answer = data.get("answer")
    
    print(f"[DEBUG] WebRTC Answer: {sid} -> {target_sid}")
    
    if target_sid and answer:
        # 방 없이 직접 전송
        await sio.emit("answer", {
            "answer": answer,
            "from": sid
        }, room=target_sid)
        print(f"[DEBUG] Answer 전송 완료: {sid} -> {target_sid}")
    else:
        print(f"[WARNING] Answer 전송 실패: target_sid={target_sid}, answer 존재={answer is not None}")

@sio.event
async def ice_candidate(sid, data):
    """ICE Candidate 전송 (방 없이 직접 전송)"""
    target_sid = data.get("target")
    candidate = data.get("candidate")
    
    if target_sid and candidate:
        # 방 없이 직접 전송
        await sio.emit("ice-candidate", {
            "candidate": candidate,
            "from": sid
        }, room=target_sid)
        print(f"[DEBUG] ICE Candidate 전송: {sid} -> {target_sid}")
    else:
        print(f"[WARNING] ICE Candidate 전송 실패: target_sid={target_sid}, candidate 존재={candidate is not None}")

@sio.event
async def message(sid, data):
    """채팅 메시지 전송"""
    if sid not in users:
        print(f"[WARNING] 메시지 전송 실패: 사용자 정보 없음 (sid={sid})")
        return
    
    user = users[sid]
    room_id = user.get("room_id")
    username = user.get("username")
    user_id = user.get("user_id")
    message_text = data.get("message", "")
    
    print(f"[DEBUG] 채팅 메시지: username={username}, room_id={room_id}, message_length={len(message_text)}")
    
    if room_id:
        db = SessionLocal()
        try:
            # 데이터베이스에 채팅 메시지 저장
            meeting_id = rooms[room_id].get("db_id")
            if meeting_id:
                event = MeetingEvent(
                    meeting_id=meeting_id,
                    event_type="chat",
                    user_id=user_id,
                    username=username,
                    message=message_text,
                    timestamp=datetime.utcnow()
                )
                db.add(event)
                db.commit()
                print(f"[DEBUG] 채팅 메시지 DB 저장 완료: meeting_id={meeting_id}")
            else:
                print(f"[WARNING] meeting_id 없음: room_id={room_id}")
        except Exception as e:
            print(f"[ERROR] 채팅 메시지 저장 중 오류: {e}")
            import traceback
            print(f"[ERROR] 상세 오류:\n{traceback.format_exc()}")
            db.rollback()
        finally:
            db.close()
        
        await sio.emit("message", {
            "username": username,
            "message": message_text,
            "timestamp": datetime.now().isoformat()
        }, room=room_id)
        print(f"[DEBUG] 메시지 브로드캐스트 완료: {username}: {message_text[:50]}...")

@sio.event
async def toggle_video(sid, data):
    """비디오 토글"""
    if sid not in users:
        return
    
    user = users[sid]
    room_id = user.get("room_id")
    enabled = data.get("enabled", True)
    
    if room_id:
        await sio.emit("video-toggled", {
            "sid": sid,
            "enabled": enabled
        }, room=room_id, skip_sid=sid)

@sio.event
async def toggle_audio(sid, data):
    """오디오 토글"""
    if sid not in users:
        return
    
    user = users[sid]
    room_id = user.get("room_id")
    enabled = data.get("enabled", True)
    
    if room_id:
        await sio.emit("audio-toggled", {
            "sid": sid,
            "enabled": enabled
        }, room=room_id, skip_sid=sid)

@sio.event
async def screen_share(sid, data):
    """화면 공유 시작/중지"""
    if sid not in users:
        return
    
    user = users[sid]
    room_id = user.get("room_id")
    sharing = data.get("sharing", False)
    
    if room_id:
        await sio.emit("screen-share", {
            "sid": sid,
            "sharing": sharing,
            "username": user.get("username")
        }, room=room_id)

@sio.event
async def whiteboard_draw(sid, data):
    """화이트보드 그리기"""
    if sid not in users:
        return
    
    user = users[sid]
    room_id = data.get("room_id")
    
    if room_id and room_id in rooms:
        # 방의 다른 사용자들에게 그리기 데이터 전송
        await sio.emit("whiteboard-draw", data, room=room_id, skip_sid=sid)

@sio.event
async def whiteboard_clear(sid, data):
    """화이트보드 지우기"""
    if sid not in users:
        return
    
    user = users[sid]
    room_id = data.get("room_id")
    
    if room_id and room_id in rooms:
        # 방의 모든 사용자에게 지우기 알림
        await sio.emit("whiteboard-clear", {}, room=room_id)

if __name__ == "__main__":
    # static 디렉토리 생성
    os.makedirs("static", exist_ok=True)
    print(f"[DEBUG] static 디렉토리 확인 완료")
    
    # Windows 콘솔 인코딩 설정
    import sys
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
        print(f"[DEBUG] Windows 콘솔 인코딩 설정 완료")
    
    # 데이터베이스 초기화 확인
    print(f"[DEBUG] 데이터베이스 초기화 중...")
    try:
        init_db()
        print(f"[DEBUG] 데이터베이스 초기화 완료")
    except Exception as e:
        print(f"[ERROR] 데이터베이스 초기화 실패: {e}")
        import traceback
        print(f"[ERROR] 상세 오류:\n{traceback.format_exc()}")
    
    # 로컬 IP 주소 가져오기
    def get_local_ip():
        try:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "localhost"
    
    local_ip = get_local_ip()
    
    # 포트 설정 (환경 변수 또는 기본값)
    port = int(os.getenv("PORT", 8000))
    
    print("=" * 60)
    print("🚀 ZOOM 클론 서버 시작 중...")
    print(f"[DEBUG] 서버 설정: host=0.0.0.0, port={port}")
    print(f"[DEBUG] 로컬 IP: {local_ip}")
    print(f"[DEBUG] 데이터베이스 URL: {os.getenv('DATABASE_URL', 'sqlite:///./zoom_clone.db')}")
    print("=" * 60)
    print("📡 로컬 접속: http://localhost:8000")
    print(f"📡 네트워크 접속: http://{local_ip}:8000")
    print("=" * 60)
    print("💡 같은 네트워크의 다른 기기에서 접속하려면:")
    print(f"   → http://{local_ip}:8000")
    print("=" * 60)
    print(f"[DEBUG] Socket.io 서버 시작: socket_app")
    print(f"[DEBUG] FastAPI 앱 시작: app")
    print("=" * 60)
    uvicorn.run(socket_app, host="0.0.0.0", port=port, log_level="info")

