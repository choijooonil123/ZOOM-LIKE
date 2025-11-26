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
# 프론트엔드 URL 허용 (환경 변수 또는 기본값)
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://screen-share-b540b.web.app")
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:8000",
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "https://screen-share-b540b.web.app",
    # 개발 환경을 위한 모든 도메인 허용 (프로덕션에서는 제거 권장)
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if "*" not in ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.io 서버 생성
# 프론트엔드 URL 허용 (위에서 이미 정의된 FRONTEND_URL 사용)
sio = socketio.AsyncServer(cors_allowed_origins=["*"], async_mode='asgi')
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
init_db()

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

@app.options("/api/{path:path}")
async def options_handler(path: str):
    """CORS preflight 요청 처리"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true"
        }
    )

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
    try:
        # 사용자명 중복 확인
        if get_user_by_username(db, user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 사용자명입니다"
            )
        
        # 이메일 중복 확인
        if get_user_by_email(db, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 이메일입니다"
            )
        
        # 비밀번호 길이 검증
        if len(user_data.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비밀번호는 최소 6자 이상이어야 합니다"
            )
        
        # 사용자 생성
        db_user = create_user(
            db=db,
            username=user_data.username,
            email=user_data.email,
            password=user_data.password
        )
        
        # JWT 토큰 생성
        access_token = create_access_token(data={"sub": db_user.username, "user_id": db_user.id})
        
        return TokenResponse(
            access_token=access_token,
            user={
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email
            }
        )
    except HTTPException:
        # HTTPException은 그대로 재발생
        raise
    except Exception as e:
        print(f"회원가입 오류: {str(e)}")
        import traceback
        traceback.print_exc()
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
    # 사용자 인증
    user = authenticate_user(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자명 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.username, "user_id": user.id})
    
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 필요합니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # "Bearer " 접두사 제거
    try:
        token = authorization.replace("Bearer ", "")
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="잘못된 인증 형식입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 토큰 검증
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username: str = payload.get("sub")
    user_id: int = payload.get("user_id")
    if username is None or user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@app.get("/api/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 조회"""
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
    # 사용자가 참가한 회의 조회
    meetings = db.query(Meeting).join(MeetingParticipant).filter(
        MeetingParticipant.user_id == current_user.id
    ).order_by(Meeting.started_at.desc()).offset(skip).limit(limit).all()
    
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
    
    return {"meetings": result, "total": len(result)}

@app.get("/api/meetings/{meeting_id}/timeline")
async def get_meeting_timeline(
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """회의 타임라인 조회"""
    # 회의 존재 확인 및 권한 확인
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="회의를 찾을 수 없습니다"
        )
    
    # 참가자 확인 (권한 체크)
    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.user_id == current_user.id
    ).first()
    
    if not participant and meeting.created_by != current_user.id:
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
    print(f"클라이언트 연결: {sid}")
    await sio.emit("connected", {"sid": sid}, room=sid)

@sio.event
async def disconnect(sid):
    """클라이언트 연결 해제"""
    print(f"클라이언트 연결 해제: {sid}")
    # 사용자가 속한 방에서 제거
    if sid in users:
        user = users[sid]
        room_id = user.get("room_id")
        username = user.get("username")
        user_id = user.get("user_id")
        
        db = SessionLocal()
        try:
            if room_id and room_id in rooms:
                if sid in rooms[room_id].get("users", []):
                    rooms[room_id]["users"].remove(sid)
                
                # 데이터베이스에 나감 이벤트 기록
                meeting_id = rooms[room_id].get("db_id")
                if meeting_id:
                    # 참가자 정보 업데이트
                    participant = db.query(MeetingParticipant).filter(
                        MeetingParticipant.meeting_id == meeting_id,
                        MeetingParticipant.username == username
                    ).order_by(MeetingParticipant.joined_at.desc()).first()
                    
                    if participant and not participant.left_at:
                        participant.left_at = datetime.utcnow()
                        if participant.joined_at:
                            duration = (datetime.utcnow() - participant.joined_at).total_seconds()
                            participant.duration_seconds = int(duration)
                    
                    # 나감 이벤트 기록
                    event = MeetingEvent(
                        meeting_id=meeting_id,
                        event_type="user_leave",
                        user_id=user_id,
                        username=username,
                        timestamp=datetime.utcnow()
                    )
                    db.add(event)
                    
                    # 방이 비어있으면 회의 종료
                    if len(rooms[room_id]["users"]) == 0:
                        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
                        if meeting:
                            meeting.ended_at = datetime.utcnow()
                            meeting.is_active = False
                            if meeting.started_at:
                                duration = (datetime.utcnow() - meeting.started_at).total_seconds()
                                meeting.duration_seconds = int(duration)
                    
                    db.commit()
                
                await sio.emit("user-left", {"sid": sid, "username": username}, room=room_id)
        except Exception as e:
            print(f"연결 해제 중 오류: {e}")
            db.rollback()
        finally:
            db.close()
        
        del users[sid]

@sio.event
async def join_room(sid, data):
    """회의실 참가"""
    room_id = data.get("room_id")
    username = data.get("username", f"User_{sid[:8]}")
    user_id = data.get("user_id")  # 로그인한 사용자의 ID (선택사항)
    
    if not room_id:
        await sio.emit("error", {"message": "방 ID가 필요합니다"}, room=sid)
        return
    
    db = SessionLocal()
    try:
        # 방이 없으면 생성 (데이터베이스에도 저장)
        if room_id not in rooms:
            rooms[room_id] = {
                "id": room_id,
                "users": [],
                "created_at": datetime.now().isoformat()
            }
            
            # 데이터베이스에 회의 생성
            meeting = Meeting(
                room_id=room_id,
                created_by=user_id,
                started_at=datetime.utcnow(),
                is_active=True
            )
            db.add(meeting)
            db.commit()
            db.refresh(meeting)
            rooms[room_id]["db_id"] = meeting.id
        else:
            # 기존 회의 조회
            meeting = db.query(Meeting).filter(Meeting.room_id == room_id, Meeting.is_active == True).first()
            if meeting:
                rooms[room_id]["db_id"] = meeting.id
        
        # 사용자 정보 저장
        users[sid] = {
            "sid": sid,
            "username": username,
            "room_id": room_id,
            "user_id": user_id,
            "joined_at": datetime.now().isoformat()
        }
        
        # 방에 사용자 추가
        rooms[room_id]["users"].append(sid)
        await sio.enter_room(sid, room_id)
        
        # 데이터베이스에 참가자 기록
        if meeting:
            participant = MeetingParticipant(
                meeting_id=meeting.id,
                user_id=user_id,
                username=username,
                joined_at=datetime.utcnow()
            )
            db.add(participant)
            
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
        
        # 기존 사용자들에게 새 사용자 알림
        await sio.emit("user-joined", {
            "sid": sid,
            "username": username
        }, room=room_id, skip_sid=sid)
        
        # 새 사용자에게 기존 사용자 목록 전송
        existing_users = [
            {"sid": uid, "username": users[uid].get("username")}
            for uid in rooms[room_id]["users"] if uid != sid and uid in users
        ]
        await sio.emit("existing-users", {"users": existing_users}, room=sid)
        
        print(f"사용자 {username} ({sid})가 방 {room_id}에 참가했습니다")
    except Exception as e:
        print(f"회의 참가 중 오류: {e}")
        db.rollback()
    finally:
        db.close()

@sio.event
async def offer(sid, data):
    """WebRTC Offer 전송"""
    target_sid = data.get("target")
    offer = data.get("offer")
    
    if target_sid and offer:
        await sio.emit("offer", {
            "offer": offer,
            "from": sid
        }, room=target_sid)
        print(f"Offer 전송: {sid} -> {target_sid}")

@sio.event
async def answer(sid, data):
    """WebRTC Answer 전송"""
    target_sid = data.get("target")
    answer = data.get("answer")
    
    if target_sid and answer:
        await sio.emit("answer", {
            "answer": answer,
            "from": sid
        }, room=target_sid)
        print(f"Answer 전송: {sid} -> {target_sid}")

@sio.event
async def ice_candidate(sid, data):
    """ICE Candidate 전송"""
    target_sid = data.get("target")
    candidate = data.get("candidate")
    
    if target_sid and candidate:
        await sio.emit("ice-candidate", {
            "candidate": candidate,
            "from": sid
        }, room=target_sid)

@sio.event
async def message(sid, data):
    """채팅 메시지 전송"""
    if sid not in users:
        return
    
    user = users[sid]
    room_id = user.get("room_id")
    username = user.get("username")
    user_id = user.get("user_id")
    message_text = data.get("message", "")
    
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
        except Exception as e:
            print(f"채팅 메시지 저장 중 오류: {e}")
            db.rollback()
        finally:
            db.close()
        
        await sio.emit("message", {
            "username": username,
            "message": message_text,
            "timestamp": datetime.now().isoformat()
        }, room=room_id)
        print(f"메시지: {username}: {message_text}")

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
    
    # Windows 콘솔 인코딩 설정
    import sys
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
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
    
    print("🚀 ZOOM 클론 서버 시작 중...")
    print("📡 로컬 접속: http://localhost:8000")
    print(f"📡 네트워크 접속: http://{local_ip}:8000")
    print("=" * 50)
    print("💡 같은 네트워크의 다른 기기에서 접속하려면:")
    print(f"   → http://{local_ip}:8000")
    print("=" * 50)
    uvicorn.run(socket_app, host="0.0.0.0", port=port, log_level="info")

