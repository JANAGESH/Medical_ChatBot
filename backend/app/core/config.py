"""
Aegis AI Clinical Platform - Global Configurations.

This module defines the settings schema and environment loading rules using Pydantic Settings.
Environment variables defined here take precedence and fallback to values loaded from the root .env.
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PINECONE_API_KEY: str
    GROQ_API_KEY: str
    
    # Auth configuration
    JWT_SECRET_KEY: str = "supersecret_medical_jwt_key_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Database configuration
    # By default, falls back to SQLite so local setup is effortless
    DATABASE_URL: str = "sqlite:///./medical.db"
    
    # Server configuration
    PORT: int = 10000
    HOST: str = ""
    
    # RAG Settings
    PINECONE_INDEX: str = "medical-chatbot"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Read dotenv from either the current directory or the root directory
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
