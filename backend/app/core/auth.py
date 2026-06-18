from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Request, HTTPException, status, Depends
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db.database import get_db
from backend.app.db.models import User

# Configure password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    # Extract the Authorization header manually
    auth_header = request.headers.get("Authorization")
    
    # -------------------------------------------------------------------------
    # 🛠️ TEMPORARY BYPASS: Local Development / Unauthenticated Testing Fallback
    # -------------------------------------------------------------------------
    # If no token is provided in the headers, auto-log in as a local mock developer
    # user. This keeps database schemas, foreign keys, and multi-user context working.
    if not auth_header:
        mock_email = "local-developer@aegis.com"
        mock_user = db.query(User).filter(User.email == mock_email).first()
        if not mock_user:
            mock_user = User(
                email=mock_email,
                hashed_password=hash_password("local_dev_password_123")
            )
            db.add(mock_user)
            db.commit()
            db.refresh(mock_user)
        return mock_user
    # -------------------------------------------------------------------------

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized access. Invalid or missing token.",
    )
    
    try:
        # Expecting format: "Bearer <token>"
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise credentials_exception
        token = parts[1]
    except Exception:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

