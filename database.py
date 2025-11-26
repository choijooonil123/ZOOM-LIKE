"""
데이터베이스 모델 및 설정
"""
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# SQLite 또는 PostgreSQL 데이터베이스 URL 설정
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zoom_clone.db")

# SQLite의 경우 connect_args 필요
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    # PostgreSQL의 경우
    engine = create_engine(DATABASE_URL, echo=False)

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
    meetings = relationship("Meeting", back_populates="creator", foreign_keys="Meeting.created_by")
    participants = relationship("MeetingParticipant", back_populates="user")


class Meeting(Base):
    """회의 모델"""
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)

    # 관계
    creator = relationship("User", foreign_keys=[created_by], back_populates="meetings")
    participants_rel = relationship("MeetingParticipant", back_populates="meeting")
    events = relationship("MeetingEvent", back_populates="meeting")


class MeetingParticipant(Base):
    """회의 참가자 모델"""
    __tablename__ = "meeting_participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    # 관계
    meeting = relationship("Meeting", back_populates="participants_rel")
    user = relationship("User", back_populates="participants")


class MeetingEvent(Base):
    """회의 이벤트 모델 (채팅, 참가/나감 등)"""
    __tablename__ = "meeting_events"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String, nullable=True)
    event_type = Column(String, nullable=False)  # 'user_join', 'user_leave', 'chat', etc.
    message = Column(Text, nullable=True)
    data = Column(Text, nullable=True)  # JSON 문자열로 저장
    timestamp = Column(DateTime, default=datetime.utcnow)

    # 관계
    meeting = relationship("Meeting", back_populates="events")


def init_db():
    """데이터베이스 초기화 (테이블 생성)"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
