"""
Aegis AI Clinical Platform - Database Model Entities.

This module defines the SQLAlchemy declarative model schemas for:
1. User: Accounts storing credentials and vital health metrics (DOB, height, weight, gender).
2. ChatSession: Logical consultation threads grouping chat messages.
3. ChatMessage: Individual chat records preserving sender roles, text contents, and RAG sources.
"""
import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    dob = Column(String(50), nullable=True)       # Format: YYYY-MM-DD
    gender = Column(String(20), nullable=True)     # Male / Female / Other
    height = Column(Float, nullable=True)          # in cm
    weight = Column(Float, nullable=True)          # in kg
    hashed_password = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    # Using UUID strings for secure session IDs (prevents ID enumeration attacks)
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(100), nullable=False, default="New Consultation")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.timestamp.asc()")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(10), nullable=False)  # "user" or "bot"
    content = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)  # JSON-serialized list of retrieved RAG source cards
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
