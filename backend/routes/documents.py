"""
Document routes:
- Upload + store in Pinecone
- Generate exam / notes / flashcards / audio from PDF or stored doc
- Check equation from image
- Retrieve saved items
"""

import hashlib
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from auth import require_auth
from services.groq_service import (
    check_equation,
    generate_exam,
    generate_flashcards,
    generate_notes,
)
from services.audio_service import text_to_audio
from services.pinecone_service import (
    delete_document,
    query_documents,
    upsert_document,
)

router = APIRouter(prefix="/documents", tags=["documents"])

# ── In-memory stores ──────────────────────────────────────────────────────────
documents_db: dict = {}   # user_email -> {doc_id: metadata}
exams_db: dict = {}
notes_db: dict = {}
flashcards_db: dict = {}
audiobooks_db: dict = {}
equations_db: dict = {}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_pdf(content: bytes) -> str:
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content))
        text = "\n".join(p.extract_text() or "" for p in reader.pages)
        if not text.strip():
            raise HTTPException(status_code=400, detail="PDF has no extractable text (may be scanned).")
        return text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")


async def _get_text(
    file: Optional[UploadFile],
    doc_id: Optional[str],
    user_email: str,
) -> str:
    """Get text either from an uploaded file or from Pinecone via doc_id."""
    if file:
        content = await file.read()
        return _parse_pdf(content)
    if doc_id:
        # Pull stored chunks from Pinecone
        chunks = query_documents(query="", namespace=user_email, doc_ids=[doc_id], top_k=20)
        if not chunks:
            raise HTTPException(status_code=404, detail="Document not found in Pinecone.")
        return "\n".join(c["text"] for c in chunks)
    raise HTTPException(status_code=400, detail="Provide either a file or a doc_id.")


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: dict = Depends(require_auth),
) -> dict:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    doc_id = hashlib.md5(content).hexdigest()[:12]
    email = user["email"]

    text = _parse_pdf(content)

    try:
        chunk_count = upsert_document(
            doc_id=doc_id,
            text=text,
            namespace=email,
            metadata={"name": file.filename},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinecone upsert failed: {e}")

    documents_db.setdefault(email, {})[doc_id] = {
        "id": doc_id,
        "filename": file.filename,
        "uploaded_at": datetime.utcnow().isoformat(),
        "size": len(content),
        "chunks": chunk_count,
    }

    return {"id": doc_id, "filename": file.filename, "chunks": chunk_count}


@router.get("")
async def list_documents(user: dict = Depends(require_auth)) -> dict:
    docs = documents_db.get(user["email"], {})
    return {"documents": list(docs.values())}


@router.delete("/{doc_id}")
async def delete_doc(doc_id: str, user: dict = Depends(require_auth)) -> dict:
    email = user["email"]
    doc = documents_db.get(email, {}).get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    try:
        delete_document(doc_id=doc_id, namespace=email, chunk_count=doc["chunks"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinecone delete failed: {e}")
    del documents_db[email][doc_id]
    return {"status": "deleted"}


# ── Generate: Exam ────────────────────────────────────────────────────────────

@router.post("/generate-exam")
async def gen_exam(
    file: Optional[UploadFile] = File(None),
    doc_id: Optional[str] = Form(None),
    num_questions: int = Form(5),
    instructions: Optional[str] = Form(None),
    user: dict = Depends(require_auth),
) -> dict:
    email = user["email"]
    text = await _get_text(file, doc_id, email)
    result = generate_exam(text, num_questions=num_questions, instructions=instructions or "")
    saved_id = hashlib.md5(result.encode()).hexdigest()[:8]
    exams_db.setdefault(email, {})[saved_id] = {
        "id": saved_id,
        "content": result,
        "num_questions": num_questions,
        "created_at": datetime.utcnow().isoformat(),
    }
    return {"id": saved_id, "content": result}


# ── Generate: Notes ───────────────────────────────────────────────────────────

@router.post("/generate-notes")
async def gen_notes(
    file: Optional[UploadFile] = File(None),
    doc_id: Optional[str] = Form(None),
    instructions: Optional[str] = Form(None),
    user: dict = Depends(require_auth),
) -> dict:
    email = user["email"]
    text = await _get_text(file, doc_id, email)
    result = generate_notes(text, instructions=instructions or "")
    saved_id = hashlib.md5(result.encode()).hexdigest()[:8]
    notes_db.setdefault(email, {})[saved_id] = {
        "id": saved_id,
        "content": result,
        "created_at": datetime.utcnow().isoformat(),
    }
    return {"id": saved_id, "content": result}


# ── Generate: Flashcards ──────────────────────────────────────────────────────

@router.post("/generate-flashcards")
async def gen_flashcards(
    file: Optional[UploadFile] = File(None),
    doc_id: Optional[str] = Form(None),
    instructions: Optional[str] = Form(None),
    user: dict = Depends(require_auth),
) -> dict:
    email = user["email"]
    text = await _get_text(file, doc_id, email)
    cards = generate_flashcards(text, instructions=instructions or "")
    saved_id = hashlib.md5(str(cards).encode()).hexdigest()[:8]
    flashcards_db.setdefault(email, {})[saved_id] = {
        "id": saved_id,
        "cards": cards,
        "created_at": datetime.utcnow().isoformat(),
    }
    return {"id": saved_id, "cards": cards}


# ── Generate: Audio ───────────────────────────────────────────────────────────

@router.post("/generate-audio")
async def gen_audio(
    file: Optional[UploadFile] = File(None),
    doc_id: Optional[str] = Form(None),
    user: dict = Depends(require_auth),
) -> Response:
    email = user["email"]
    text = await _get_text(file, doc_id, email)

    try:
        audio_bytes = text_to_audio(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {e}")

    saved_id = hashlib.md5(audio_bytes).hexdigest()[:8]
    audiobooks_db.setdefault(email, {})[saved_id] = {
        "id": saved_id,
        "size_kb": round(len(audio_bytes) / 1024, 1),
        "created_at": datetime.utcnow().isoformat(),
        "audio": audio_bytes,   # stored in memory; use file storage in production
    }

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": f"attachment; filename=audiobook_{saved_id}.mp3"},
    )


# ── Generate: Equation check ──────────────────────────────────────────────────

@router.post("/check-equation")
async def check_eq(
    image: UploadFile = File(...),
    user: dict = Depends(require_auth),
) -> dict:
    content = await image.read()
    mime = image.content_type or "image/jpeg"

    result = check_equation(image_bytes=content, mime_type=mime)

    saved_id = hashlib.md5(content).hexdigest()[:8]
    equations_db.setdefault(user["email"], {})[saved_id] = {
        "id": saved_id,
        "result": result,
        "created_at": datetime.utcnow().isoformat(),
    }
    return {"id": saved_id, **result}


# ── Saved data retrieval ──────────────────────────────────────────────────────

@router.get("/exams")
async def get_exams(user: dict = Depends(require_auth)) -> dict:
    items = exams_db.get(user["email"], {})
    return {"exams": [{k: v for k, v in e.items()} for e in items.values()]}


@router.get("/notes")
async def get_notes(user: dict = Depends(require_auth)) -> dict:
    items = notes_db.get(user["email"], {})
    return {"notes": list(items.values())}


@router.get("/flashcards")
async def get_flashcards(user: dict = Depends(require_auth)) -> dict:
    items = flashcards_db.get(user["email"], {})
    return {"flashcards": list(items.values())}


@router.get("/audiobooks")
async def get_audiobooks(user: dict = Depends(require_auth)) -> dict:
    items = audiobooks_db.get(user["email"], {})
    # Don't return raw audio bytes in list — just metadata
    return {
        "audiobooks": [
            {k: v for k, v in a.items() if k != "audio"}
            for a in items.values()
        ]
    }


@router.get("/equations")
async def get_equations(user: dict = Depends(require_auth)) -> dict:
    items = equations_db.get(user["email"], {})
    return {"equations": list(items.values())}