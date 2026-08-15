"""
Aegis AI Clinical Platform - Pydantic DTO Validation Schemas.

This module defines request and response validation structures (Data Transfer Objects) for:
1. User registration, authentication logins, and onboarding updates.
2. Timezone-aware date validators ensuring naive timestamps serialize to UTC timezone format.
3. Consultation session records and chatbot structured queries/responses.
"""
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    nationality: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator('created_at')
    @classmethod
    def make_tz_aware(cls, v):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class UserProfileUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    dob: str = Field(..., description="Date of birth YYYY-MM-DD")
    gender: str = Field(..., description="Male, Female, or Other")
    height: float = Field(..., gt=30, lt=300, description="Height in cm")
    weight: float = Field(..., gt=5, lt=500, description="Weight in kg")
    nationality: str = Field(..., min_length=1, max_length=100, description="Nationality of the user")

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# Source Citations Schemas
class SourceDetail(BaseModel):
    source: str
    page: str
    confidence: float
    content: str

# Message Schemas
class ChatMessageBase(BaseModel):
    sender: str  # "user" or "bot"
    content: str

class ChatMessageCreate(ChatMessageBase):
    session_id: str

class ChatMessageOut(ChatMessageBase):
    id: int
    session_id: str
    timestamp: datetime
    sources: Optional[List[SourceDetail]] = None

    class Config:
        from_attributes = True

    @field_validator('timestamp')
    @classmethod
    def make_tz_aware(cls, v):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

# Session Schemas
class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Consultation"

class ChatSessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator('created_at')
    @classmethod
    def make_tz_aware(cls, v):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class ChatSessionDetailOut(ChatSessionOut):
    messages: List[ChatMessageOut] = []

    class Config:
        from_attributes = True

# RAG Query Schemas
class ChatQueryInput(BaseModel):
    session_id: str
    message: str

class ChatQueryResponse(BaseModel):
    session_id: str
    reply: str
    sources: Optional[List[SourceDetail]] = None
