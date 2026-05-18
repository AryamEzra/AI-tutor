from fastapi import APIRouter, Depends

from auth import require_auth
from routes.documents import documents_db, exams_db, notes_db, flashcards_db, audiobooks_db, equations_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("")
async def get_analytics(user: dict = Depends(require_auth)) -> dict:
    email = user["email"]
    return {
        "documents_uploaded": len(documents_db.get(email, {})),
        "saved_exams": len(exams_db.get(email, {})),
        "saved_notes": len(notes_db.get(email, {})),
        "saved_flashcards": len(flashcards_db.get(email, {})),
        "saved_audiobooks": len(audiobooks_db.get(email, {})),
        "saved_equations": len(equations_db.get(email, {})),
    }