from fastapi import APIRouter, Depends

from auth import require_auth
from models import APIKeyUpdate
from services.groq_service import AVAILABLE_MODELS

router = APIRouter(prefix="/settings", tags=["settings"])

# In-memory key store (swap for encrypted DB column in production)
api_keys_db: dict = {}


@router.post("/api-keys")
async def save_api_key(data: APIKeyUpdate, user: dict = Depends(require_auth)) -> dict:
    email = user["email"]
    api_keys_db.setdefault(email, {})[data.provider] = data.api_key
    return {"status": "success", "provider": data.provider}


@router.get("/api-keys")
async def get_api_keys(user: dict = Depends(require_auth)) -> dict:
    keys = api_keys_db.get(user["email"], {})
    return {
        "groq": ("***" + keys["groq"][-4:]) if keys.get("groq") else None,
    }


@router.get("/models")
async def list_models() -> dict:
    """Return the available Groq models so the frontend can build a selector."""
    return {"models": list(AVAILABLE_MODELS.keys())}