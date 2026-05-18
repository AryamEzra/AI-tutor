import hashlib
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from auth import require_auth
from services.pinecone_service import delete_document, upsert_document

router = APIRouter(prefix="/documents", tags=["documents"])

# In-memory document metadata store
documents_db: dict = {}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    instructions: Optional[str] = Form(None),
    user: dict = Depends(require_auth),
) -> dict:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    doc_id = hashlib.md5(content).hexdigest()[:12]
    user_email = user["email"]

    # ── Parse PDF ────────────────────────────────────────────────────────────
    try:
        import pypdf
        pdf_reader = pypdf.PdfReader(io.BytesIO(content))
        text = "\n".join(page.extract_text() or "" for page in pdf_reader.pages)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF appears to be empty or scanned (no extractable text)")

    # ── Embed & upsert into Pinecone ─────────────────────────────────────────
    try:
        chunk_count = upsert_document(
            doc_id=doc_id,
            text=text,
            namespace=user_email,          # isolate each user's vectors
            metadata={"name": file.filename, "instructions": instructions or ""},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinecone upsert failed: {e}")

    # ── Save metadata ─────────────────────────────────────────────────────────
    documents_db.setdefault(user_email, {})[doc_id] = {
        "id": doc_id,
        "name": file.filename,
        "instructions": instructions,
        "uploaded_at": datetime.utcnow().isoformat(),
        "size": len(content),
        "chunks": chunk_count,
    }

    return {"id": doc_id, "name": file.filename, "chunks": chunk_count, "status": "success"}


@router.get("")
async def list_documents(user: dict = Depends(require_auth)) -> dict:
    docs = documents_db.get(user["email"], {})
    return {
        "documents": [
            {
                "id": d["id"],
                "name": d["name"],
                "uploaded_at": d["uploaded_at"],
                "size": f"{d['size'] / 1024:.1f} KB",
                "chunks": d["chunks"],
            }
            for d in docs.values()
        ]
    }


@router.delete("/{doc_id}")
async def delete_doc(doc_id: str, user: dict = Depends(require_auth)) -> dict:
    email = user["email"]
    user_docs = documents_db.get(email, {})

    if doc_id not in user_docs:
        raise HTTPException(status_code=404, detail="Document not found")

    chunk_count = user_docs[doc_id].get("chunks", 0)

    # Remove from Pinecone
    try:
        delete_document(doc_id=doc_id, namespace=email, chunk_count=chunk_count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinecone delete failed: {e}")

    del documents_db[email][doc_id]
    return {"status": "deleted"}