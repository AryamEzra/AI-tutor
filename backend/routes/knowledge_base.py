import hashlib
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from auth import require_auth
from routes.documents import _parse_pdf, documents_db
from services.audio_service import text_to_audio
from services.groq_service import generate_exam, generate_flashcards, generate_notes
from services.pinecone_service import delete_document, query_documents, upsert_document

router = APIRouter(prefix="/knowledge-base", tags=["knowledge-base"])


class KnowledgeBaseExamRequest(BaseModel):
    document_id: str
    num_questions: int = 5
    instructions: Optional[str] = None


class KnowledgeBaseNotesRequest(BaseModel):
    document_id: str
    instructions: Optional[str] = None


class KnowledgeBaseFlashcardsRequest(BaseModel):
    document_id: str
    instructions: Optional[str] = None


class KnowledgeBaseAudioRequest(BaseModel):
    document_id: str


async def _get_document_text(document_id: str, namespace: str) -> str:
    chunks = query_documents(query="", namespace=namespace, doc_ids=[document_id], top_k=50)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found in knowledge base.")
    return "\n".join(chunk["text"] for chunk in chunks)


@router.get("/documents")
async def list_documents(user: dict = Depends(require_auth)) -> dict:
    docs = documents_db.get(user["email"], {})
    return {"documents": list(docs.values())}


@router.post("/documents")
async def upload_document(file: UploadFile = File(...), user: dict = Depends(require_auth)) -> dict:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    document_id = hashlib.md5(content).hexdigest()[:12]
    email = user["email"]

    text = _parse_pdf(content)
    try:
        chunk_count = upsert_document(
            doc_id=document_id,
            text=text,
            namespace=email,
            metadata={"name": file.filename},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinecone upsert failed: {e}")

    documents_db.setdefault(email, {})[document_id] = {
        "id": document_id,
        "filename": file.filename,
        "created_at": datetime.utcnow().isoformat(),
        "size": len(content),
        "chunks": chunk_count,
    }

    return {"id": document_id, "filename": file.filename, "chunks": chunk_count}


@router.delete("/documents/{document_id}")
async def delete_document_by_id(document_id: str, user: dict = Depends(require_auth)) -> dict:
    email = user["email"]
    doc = documents_db.get(email, {}).get(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    try:
        delete_document(doc_id=document_id, namespace=email, chunk_count=doc["chunks"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinecone delete failed: {e}")

    del documents_db[email][document_id]
    return {"status": "deleted", "id": document_id}


@router.post("/generate-exam")
async def generate_exam_from_kb(
    request: KnowledgeBaseExamRequest,
    user: dict = Depends(require_auth),
) -> dict:
    email = user["email"]
    text = await _get_document_text(request.document_id, email)
    result = generate_exam(
        text,
        num_questions=request.num_questions,
        instructions=request.instructions or "",
    )
    exam_id = hashlib.md5(result.encode()).hexdigest()[:8]
    return {"exam_id": exam_id, "content": result}


@router.post("/generate-notes")
async def generate_notes_from_kb(
    request: KnowledgeBaseNotesRequest,
    user: dict = Depends(require_auth),
) -> dict:
    email = user["email"]
    text = await _get_document_text(request.document_id, email)
    result = generate_notes(text, instructions=request.instructions or "")
    note_id = hashlib.md5(result.encode()).hexdigest()[:8]
    return {"note_id": note_id, "content": result}


@router.post("/generate-flashcards")
async def generate_flashcards_from_kb(
    request: KnowledgeBaseFlashcardsRequest,
    user: dict = Depends(require_auth),
) -> dict:
    email = user["email"]
    text = await _get_document_text(request.document_id, email)
    cards = generate_flashcards(text, instructions=request.instructions or "")
    flashcard_id = hashlib.md5(str(cards).encode()).hexdigest()[:8]
    return {"flashcard_id": flashcard_id, "cards": cards}


@router.post("/generate-audio")
async def generate_audio_from_kb(
    request: KnowledgeBaseAudioRequest,
    user: dict = Depends(require_auth),
) -> Response:
    email = user["email"]
    text = await _get_document_text(request.document_id, email)

    try:
        audio_bytes = text_to_audio(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {e}")

    audio_id = hashlib.md5(audio_bytes).hexdigest()[:8]
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": f"attachment; filename=knowledge_base_{audio_id}.mp3"},
    )
