"""
데이터베이스 설정 및 모델
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# 데이터베이스 파일 경로
# Railway에서는 DATABASE_URL 환경 변수를 제공 (PostgreSQL)
# 로컬에서는 SQLite 사용
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zoom_clone.db")

# Railway PostgreSQL URL을 SQLAlchemy 형식으로 변환
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLAlchemy 설정
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """사용자 모델"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # 관계
    meetings_created = relationship("Meeting", back_populates="creator", foreign_keys="Meeting.created_by")
    meeting_participants = relationship("MeetingParticipant", back_populates="user")


class Meeting(Base):
    """회의 모델"""
    __tablename__ = "meetings"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=True)  # 회의 제목 (선택사항)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # 회의 지속 시간 (초)
    is_active = Column(Boolean, default=True, index=True)
    # SQLAlchemy Declarative API에서 'metadata' 이름은 예약어이므로
    # 속성 이름은 meeting_metadata로 두고, 실제 컬럼 이름만 'metadata'로 지정
    meeting_metadata = Column("metadata", JSON, nullable=True)  # 추가 메타데이터
    
    # 관계
    creator = relationship("User", back_populates="meetings_created", foreign_keys=[created_by])
    participants = relationship("MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan")
    events = relationship("MeetingEvent", back_populates="meeting", cascade="all, delete-orphan", order_by="MeetingEvent.timestamp")


class MeetingParticipant(Base):
    """회의 참가자 모델"""
    __tablename__ = "meeting_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    username = Column(String, nullable=False)  # 게스트 사용자도 지원
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # 참가 시간 (초)
    
    # 관계
    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User", back_populates="meeting_participants")


class MeetingEvent(Base):
    """회의 이벤트 모델 (타임라인)"""
    __tablename__ = "meeting_events"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)  # 'chat', 'file_share', 'screen_share', 'recording', 'user_join', 'user_leave', etc.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String, nullable=True)  # 게스트 사용자 지원
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    data = Column(JSON, nullable=True)  # 이벤트별 추가 데이터
    message = Column(Text, nullable=True)  # 채팅 메시지 등
    
    # 관계
    meeting = relationship("Meeting", back_populates="events")


# 데이터베이스 테이블 생성
def init_db():
    """데이터베이스 초기화"""
    Base.metadata.create_all(bind=engine)


# 데이터베이스 세션 의존성
def get_db():
    """데이터베이스 세션 생성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

