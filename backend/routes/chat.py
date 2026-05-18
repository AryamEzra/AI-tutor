from fastapi import APIRouter, Depends

from auth import require_auth
from models import ChatRequest, ChatResponse
from services.groq_service import socratic_chat
from services.pinecone_service import query_documents

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
async def chat(data: ChatRequest, user: dict = Depends(require_auth)) -> ChatResponse:
    email = user["email"]

    # Semantic search in Pinecone for relevant context
    context = ""
    try:
        chunks = query_documents(query=data.message, namespace=email, top_k=4)
        if chunks:
            context = "\n".join(
                f"[From {c['name']}]: {c['text']}" for c in chunks
            )
    except Exception as e:
        print(f"[Pinecone query skipped] {e}")

    history = [{"role": h.role, "content": h.content} for h in data.history]

    response_text = await socratic_chat(
        message=data.message,
        history=history,
        context=context,
    )

    return ChatResponse(response=response_text)