"""
ZOOM 클론 - FastAPI 백엔드 서버
WebRTC 시그널링 및 Socket.io 통신 처리
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import socketio
import uvicorn
import json
import os
from typing import Dict, List
from datetime import datetime

# FastAPI 앱 생성
app = FastAPI(title="ZOOM Clone")

# Socket.io 서버 생성
sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode='asgi')
socket_app = socketio.ASGIApp(sio, app)

# 정적 파일 서빙
app.mount("/static", StaticFiles(directory="static"), name="static")

# 회의실 및 사용자 관리
rooms: Dict[str, Dict] = {}
users: Dict[str, Dict] = {}

@app.get("/")
async def read_root():
    """메인 페이지"""
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

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
        if room_id and room_id in rooms:
            if sid in rooms[room_id].get("users", []):
                rooms[room_id]["users"].remove(sid)
            await sio.emit("user-left", {"sid": sid, "username": user.get("username")}, room=room_id)
        del users[sid]

@sio.event
async def join_room(sid, data):
    """회의실 참가"""
    room_id = data.get("room_id")
    username = data.get("username", f"User_{sid[:8]}")
    
    if not room_id:
        await sio.emit("error", {"message": "방 ID가 필요합니다"}, room=sid)
        return
    
    # 방이 없으면 생성
    if room_id not in rooms:
        rooms[room_id] = {
            "id": room_id,
            "users": [],
            "created_at": datetime.now().isoformat()
        }
    
    # 사용자 정보 저장
    users[sid] = {
        "sid": sid,
        "username": username,
        "room_id": room_id,
        "joined_at": datetime.now().isoformat()
    }
    
    # 방에 사용자 추가
    rooms[room_id]["users"].append(sid)
    await sio.enter_room(sid, room_id)
    
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
    message_text = data.get("message", "")
    
    if room_id:
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

if __name__ == "__main__":
    # static 디렉토리 생성
    os.makedirs("static", exist_ok=True)
    
    print("🚀 ZOOM 클론 서버 시작 중...")
    print("📡 서버 주소: http://localhost:8000")
    uvicorn.run(socket_app, host="0.0.0.0", port=8000, log_level="info")

