"""
Aegis AI Clinical Platform - FastAPI Backend Server.

This file serves as the main entry point for the FastAPI backend application.
It orchestrates:
1. Environment-aware sys.path path resolutions.
2. Lifespan event managers handling automated database migrations.
3. CORS middleware security setups.
4. API Route controllers (Authentication, Profiles, Chat sessions, RAG Queries, and PDF Report analysis).
"""
import sys
import os

# Dynamically resolve import paths for 'backend' module when starting from parent or sub directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, Request, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Backend components
from backend.app.core.config import settings
from backend.app.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from backend.app.db.database import engine, Base, get_db
from backend.app.db.models import User, ChatSession, ChatMessage
from backend.app.schemas.schemas import (
    UserCreate,
    UserLogin,
    UserOut,
    UserProfileUpdate,
    Token,
    ChatSessionOut,
    ChatSessionCreate,
    ChatMessageOut,
    ChatQueryInput,
    ChatQueryResponse
)
from backend.app.services.helper import run_rag_query, extract_pdf_summary, get_chat_model

# Automatically create tables on startup (no extra migration steps for beginners)
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Dynamic SQLite/PG table migration for the name column and patient profile details
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'name' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR(100)"))
            print("Successfully migrated users table to include 'name' column.")
        
        # Add dob, gender, height, weight columns dynamically
        if 'dob' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN dob VARCHAR(50)"))
        if 'gender' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN gender VARCHAR(20)"))
        if 'height' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN height FLOAT"))
        if 'weight' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN weight FLOAT"))
        if 'nationality' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN nationality VARCHAR(100)"))
            print("Successfully migrated users table to include profile and nationality columns.")
        
        # Add sources column dynamically to chat_messages table if missing
        msg_columns = [c['name'] for c in inspector.get_columns('chat_messages')]
        if 'sources' not in msg_columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE chat_messages ADD COLUMN sources TEXT"))
            print("Successfully migrated chat_messages table to include 'sources' column.")
    except Exception as e:
        print(f"Migration check completed/ignored: {e}")
    yield

app = FastAPI(
    title="Medical AI Assistant Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for simplified local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 🔐 AUTHENTICATION ENDPOINTS
# ==========================================

@app.post("/api/auth/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    # Secure password and create user record
    hashed = hash_password(user_data.password)
    new_user = User(email=user_data.email, name=user_data.name, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate session access token
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }


@app.post("/api/auth/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Generate access token
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }



@app.get("/api/auth/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.put("/api/auth/profile", response_model=UserOut)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.name = profile_data.name
    current_user.dob = profile_data.dob
    current_user.gender = profile_data.gender
    current_user.height = profile_data.height
    current_user.weight = profile_data.weight
    current_user.nationality = profile_data.nationality
    db.commit()
    db.refresh(current_user)
    return current_user


# ==========================================
# 💬 CHAT SESSION ENDPOINTS
# ==========================================

@app.get("/api/chat/sessions", response_model=List[ChatSessionOut])
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession)\
        .filter(ChatSession.user_id == current_user.id)\
        .order_by(ChatSession.created_at.desc())\
        .all()
    return sessions


@app.post("/api/chat/sessions", response_model=ChatSessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_session = ChatSession(
        title=session_data.title or "New Consultation",
        user_id=current_user.id
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@app.delete("/api/chat/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession)\
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)\
        .first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    db.delete(session)
    db.commit()
    return {"detail": "Chat session successfully deleted"}


import json

# ==========================================
# 🧬 CHAT HISTORY & RAG QUERY ENDPOINTS
# ==========================================

@app.get("/api/chat/sessions/{session_id}/history", response_model=List[ChatMessageOut])
def get_session_history(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify session ownership
    session = db.query(ChatSession)\
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)\
        .first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access denied"
        )
    
    # Standardized response mapping with JSON deserialization of source citations
    history_out = []
    for msg in session.messages:
        parsed_sources = None
        if msg.sources:
            try:
                parsed_sources = json.loads(msg.sources)
            except Exception:
                pass
        
        history_out.append({
            "id": msg.id,
            "session_id": msg.session_id,
            "sender": msg.sender,
            "content": msg.content,
            "timestamp": msg.timestamp,
            "sources": parsed_sources
        })
    
    return history_out


@app.post("/api/chat/query", response_model=ChatQueryResponse)
def query_chatbot(
    query_input: ChatQueryInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify session ownership
    session = db.query(ChatSession)\
        .filter(ChatSession.id == query_input.session_id, ChatSession.user_id == current_user.id)\
        .first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access denied"
        )
    
    # 1. Fetch current session history from database for context injection
    history_records = session.messages
    
    # 2. Add User message to the database immediately
    user_message = ChatMessage(
        session_id=session.id,
        sender="user",
        content=query_input.message,
        sources=None
    )
    db.add(user_message)
    db.commit()
    
    # 3. Execute LangChain RAG pipeline returning text response and structured sources list
    try:
        user_profile = {
            "name": current_user.name,
            "dob": current_user.dob,
            "gender": current_user.gender,
            "height": current_user.height,
            "weight": current_user.weight,
            "nationality": current_user.nationality
        }
        reply, sources = run_rag_query(query_input.message, history_records, user_profile)
        
        # 3.1. Auto-generate conversation title based on chat context if this is the first message in the session
        if len(history_records) == 0:
            try:
                chat_model = get_chat_model()
                title_prompt = (
                    "You are a medical assistant. Generate a highly concise, professional, title-cased conversation title (maximum 3-4 words) "
                    "summarizing the user's first medical inquiry below. Do not include any punctuation, quotes, or filler. "
                    "Example user input: 'Explain causes for iron deficiency?' -> Iron Deficiency Causes. "
                    f"User inquiry: '{query_input.message}'"
                )
                title_response = chat_model.invoke([("user", title_prompt)])
                suggested_title = title_response.content.strip().strip('"').strip("'")
                if suggested_title and len(suggested_title) < 100:
                    session.title = suggested_title
                    db.commit()
            except Exception as title_err:
                print(f"Title generation ignored: {title_err}")
                
    except Exception as e:
        reply = (
            "I apologize, but I am currently encountering technical difficulties connecting to my medical database. "
            f"Error details: {str(e)}. Please check your API keys or try again shortly."
        )
        sources = []
    
    # 4. Save Bot response to the database with JSON-serialized source cards
    bot_message = ChatMessage(
        session_id=session.id,
        sender="bot",
        content=reply,
        sources=json.dumps(sources) if sources else None
    )
    db.add(bot_message)
    db.commit()
    
    return {
        "session_id": session.id,
        "reply": reply,
        "sources": sources
    }


@app.post("/api/chat/upload", response_model=ChatQueryResponse)
async def upload_medical_report(
    session_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify session ownership
    session = db.query(ChatSession)\
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)\
        .first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access denied"
        )
    
    # Read file bytes
    file_bytes = await file.read()
    
    # 1. Add User message "Uploaded PDF Report: [Filename]" to DB
    user_msg_text = f"Uploaded PDF Report: {file.filename}"
    user_message = ChatMessage(
        session_id=session.id,
        sender="user",
        content=user_msg_text,
        sources=None
    )
    db.add(user_message)
    
    # 2. Extract and summarize PDF content
    summary = extract_pdf_summary(file_bytes)
    
    # 3. Add Bot summary response to DB
    bot_message = ChatMessage(
        session_id=session.id,
        sender="bot",
        content=summary,
        sources=None
    )
    db.add(bot_message)
    db.commit()
    
    return {
        "session_id": session.id,
        "reply": summary,
        "sources": []
    }


# Health Check & Root Endpoints
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Aegis AI Clinical Platform Backend",
        "version": "1.0.0"
    }


@app.get("/")
def read_root():
    return {
        "name": "Aegis AI Clinical Platform",
        "description": "Production-grade medical conversational RAG server.",
        "status": "Online",
        "health": "/health",
        "docs_url": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
