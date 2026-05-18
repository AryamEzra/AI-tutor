import hashlib
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from auth import require_auth
from models import ChatMessage, ChatResponse
from routes.settings import api_keys_db
from services.groq_service import chat_completion
from services.pinecone_service import query_documents

router = APIRouter(prefix="/chat", tags=["chat"])

chat_sessions_db: dict = {}


def _get_api_key(user_email: str) -> str:
    """Resolve Groq key: env var takes priority, then per-user saved key."""
    key = os.environ.get("GROQ_API_KEY") or api_keys_db.get(user_email, {}).get("groq")
    if not key:
        raise HTTPException(
            status_code=400,
            detail="No Groq API key configured. Add GROQ_API_KEY to .env or save it in Settings.",
        )
    return key


@router.post("", response_model=ChatResponse)
async def chat(data: ChatMessage, user: dict = Depends(require_auth)) -> ChatResponse:
    email = user["email"]
    api_key = _get_api_key(email)

    # ── Semantic search in Pinecone ───────────────────────────────────────────
    context = ""
    sources = []
    try:
        chunks = query_documents(
            query=data.message,
            namespace=email,
            doc_ids=data.document_ids or None,
            top_k=5,
        )
        for chunk in chunks:
            context += f"\n--- From {chunk['name']} (relevance {chunk['score']}) ---\n{chunk['text']}\n"
            # Deduplicate sources list
            if not any(s["id"] == chunk["doc_id"] for s in sources):
                sources.append({"id": chunk["doc_id"], "name": chunk["name"]})
    except Exception as e:
        # Gracefully degrade — chat still works without context
        print(f"[Pinecone query failed] {e}")

    # ── Groq chat completion ──────────────────────────────────────────────────
    response_text = await chat_completion(
        user_message=data.message,
        api_key=api_key,
        context=context,
        model=data.model,
    )

    # ── Session management ────────────────────────────────────────────────────
    session_id = (
        data.session_id
        or hashlib.md5(f"{email}{datetime.utcnow()}".encode()).hexdigest()[:12]
    )

    chat_sessions_db.setdefault(email, {})
    if session_id not in chat_sessions_db[email]:
        chat_sessions_db[email][session_id] = {
            "id": session_id,
            "title": (data.message[:50] + "...") if len(data.message) > 50 else data.message,
            "messages": [],
            "created_at": datetime.utcnow().isoformat(),
        }

    now = datetime.utcnow().isoformat()
    chat_sessions_db[email][session_id]["messages"].extend([
        {"role": "user", "content": data.message, "timestamp": now},
        {"role": "assistant", "content": response_text, "timestamp": now},
    ])

    return ChatResponse(response=response_text, session_id=session_id, sources=sources)


@router.get("/sessions")
async def list_sessions(user: dict = Depends(require_auth)) -> dict:
    sessions = chat_sessions_db.get(user["email"], {})
    return {
        "sessions": [
            {
                "id": s["id"],
                "title": s["title"],
                "created_at": s["created_at"],
                "message_count": len(s["messages"]),
                "last_message": s["messages"][-1]["content"][:100] if s["messages"] else "",
            }
            for s in sessions.values()
        ]
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, user: dict = Depends(require_auth)) -> dict:
    sessions = chat_sessions_db.get(user["email"], {})
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id]


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(require_auth)) -> dict:
    email = user["email"]
    if email in chat_sessions_db and session_id in chat_sessions_db[email]:
        del chat_sessions_db[email][session_id]
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Session not found")