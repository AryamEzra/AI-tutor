"""
Socratic Tutor API v2
"""

import fastapi
import fastapi.middleware.cors

from routes.auth import router as auth_router
from routes.chat import router as chat_router
from routes.documents import router as documents_router
from routes.knowledge_base import router as knowledge_base_router
from routes.settings import router as settings_router
from routes.analytics import router as analytics_router
from services.pinecone_service import pinecone_healthy
from services.sqlite_service import init_db

app = fastapi.FastAPI(title="Socratic Tutor API", version="2.0.0")


@app.on_event("startup")
async def startup_event() -> None:
    init_db()

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(knowledge_base_router)
app.include_router(settings_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {"message": "Socratic Tutor API v2"}

@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "pinecone": "connected" if pinecone_healthy() else "unavailable",
    }