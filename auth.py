"""
인증 관련 유틸리티
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import User
import os
import bcrypt

# 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 설정
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30일


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    # bcrypt는 72바이트 이상의 비밀번호를 처리하지 못하므로 자름
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # bcrypt를 직접 사용하여 검증
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    # bcrypt는 72바이트 이상의 비밀번호를 처리하지 못하므로 자름
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # UTF-8 바이트 기준으로 72바이트로 자르기
        password_bytes = password_bytes[:72]
    
    # bcrypt를 직접 사용하여 해싱 (passlib의 내부 초기화 문제 회피)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # passlib 형식으로 변환 (bcrypt 해시는 이미 올바른 형식)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """JWT 토큰 검증"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """사용자명으로 사용자 조회"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """이메일로 사용자 조회"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """ID로 사용자 조회"""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, username: str, email: str, password: str) -> User:
    """새 사용자 생성"""
    # 비밀번호 해싱 (get_password_hash에서 72바이트 제한 처리)
    hashed_password = get_password_hash(password)
    db_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """사용자 인증"""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    # 마지막 로그인 시간 업데이트
    user.last_login = datetime.utcnow()
    db.commit()
    return user

