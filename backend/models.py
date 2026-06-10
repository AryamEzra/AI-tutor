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


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatHistoryMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatHistoryMessage] = []


class ChatResponse(BaseModel):
    response: str


# ── Settings ──────────────────────────────────────────────────────────────────

class APIKeyUpdate(BaseModel):
    provider: str
    api_key: str


# ── Knowledge Base ───────────────────────────────────────────────────────────

class KnowledgeBaseDocument(BaseModel):
    id: str
    user_email: str
    filename: str
    created_at: str
    size: int
    chunks: int
    metadata: Optional[dict] = None