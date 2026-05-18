from fastapi import APIRouter, Depends

from auth import require_auth
from routes.documents import documents_db
from routes.chat import chat_sessions_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("")
async def get_analytics(user: dict = Depends(require_auth)) -> dict:
    email = user["email"]
    docs = documents_db.get(email, {})
    sessions = chat_sessions_db.get(email, {})
    total_messages = sum(len(s["messages"]) for s in sessions.values())

    return {
        "documents_count": len(docs),
        "sessions_count": len(sessions),
        "total_messages": total_messages,
    }