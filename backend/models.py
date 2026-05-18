from pydantic import BaseModel
from typing import Optional


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# ── Settings ──────────────────────────────────────────────────────────────────

class APIKeyUpdate(BaseModel):
    provider: str   # "groq"
    api_key: str


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    document_ids: Optional[list[str]] = None
    model: Optional[str] = None   # allow frontend to pick Groq model


class ChatResponse(BaseModel):
    response: str
    session_id: str
    sources: list[dict] = []