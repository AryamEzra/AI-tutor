"""
Socratic Tutor FastAPI Backend
RAG-based tutoring system with Pinecone vector database
"""

import os
import io
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import fastapi
import fastapi.middleware.cors
from fastapi import UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import bcrypt
from jose import jwt, JWTError

# Initialize FastAPI app
app = fastapi.FastAPI(title="Socratic Tutor API ARYAM TEST", version="1.0.0")

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)
SECRET_KEY = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# In-memory storage (replace with database in production)
users_db: dict = {}
documents_db: dict = {}
chat_sessions_db: dict = {}
api_keys_db: dict = {}


# ============== Models ==============

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class APIKeyUpdate(BaseModel):
    provider: str  # "groq"
    api_key: str


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    document_ids: Optional[list[str]] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    sources: list[dict] = []


# ============== Auth Helpers ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email and email in users_db:
            return users_db[email]
    except JWTError:
        pass
    return None


async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


# ============== Auth Routes ==============

@app.post("/auth/register")
async def register(user: UserCreate) -> dict:
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    users_db[user.email] = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name or user.email.split("@")[0],
        "created_at": datetime.utcnow().isoformat(),
    }
    
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/login")
async def login(user: UserLogin) -> dict:
    db_user = users_db.get(user.email)
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me")
async def get_me(user: dict = Depends(require_auth)) -> dict:
    return {
        "email": user["email"],
        "name": user["name"],
        "created_at": user["created_at"],
    }


# ============== API Keys Routes ==============

@app.post("/settings/api-keys")
async def save_api_key(data: APIKeyUpdate, user: dict = Depends(require_auth)) -> dict:
    user_email = user["email"]
    if user_email not in api_keys_db:
        api_keys_db[user_email] = {}
    
    api_keys_db[user_email][data.provider] = data.api_key
    return {"status": "success", "provider": data.provider}


@app.get("/settings/api-keys")
async def get_api_keys(user: dict = Depends(require_auth)) -> dict:
    user_email = user["email"]
    keys = api_keys_db.get(user_email, {})
    # Return masked keys
    return {
        "groq": "***" + keys.get("groq", "")[-4:] if keys.get("groq") else None,
    }


# ============== Document Routes ==============

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    instructions: Optional[str] = None,
    user: dict = Depends(require_auth),
) -> dict:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    doc_id = hashlib.md5(content).hexdigest()[:12]
    
    # Extract text from PDF (simplified - in production use pypdf)
    try:
        import pypdf
        pdf_reader = pypdf.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    
    # Store document
    user_email = user["email"]
    if user_email not in documents_db:
        documents_db[user_email] = {}
    
    documents_db[user_email][doc_id] = {
        "id": doc_id,
        "name": file.filename,
        "text": text,
        "instructions": instructions,
        "uploaded_at": datetime.utcnow().isoformat(),
        "size": len(content),
        "chunks": len(text) // 1000 + 1,
    }
    
    # TODO: In production, embed text and store in Pinecone
    # chunks = chunk_text(text)
    # embeddings = embed_chunks(chunks)
    # pinecone_index.upsert(vectors=embeddings, namespace=user_email)
    
    return {
        "id": doc_id,
        "name": file.filename,
        "chunks": documents_db[user_email][doc_id]["chunks"],
        "status": "success",
    }


@app.get("/documents")
async def list_documents(user: dict = Depends(require_auth)) -> dict:
    user_email = user["email"]
    docs = documents_db.get(user_email, {})
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


@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(require_auth)) -> dict:
    user_email = user["email"]
    if user_email in documents_db and doc_id in documents_db[user_email]:
        del documents_db[user_email][doc_id]
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Document not found")


# ============== Chat Routes ==============

def generate_socratic_prompt(user_message: str, context: str = "") -> str:
    """Generate a Socratic tutoring prompt."""
    system_prompt = """You are a Socratic tutor. Your role is to help students learn through guided questioning rather than direct answers. 

Key principles:
1. Never give direct answers - always guide with questions
2. Ask clarifying questions to understand what the student already knows
3. Break complex topics into smaller, manageable questions
4. Encourage the student to think critically and discover answers themselves
5. Validate their reasoning when correct, gently redirect when incorrect
6. Use follow-up questions to deepen understanding

If context from documents is provided, use it to ask more targeted questions about the specific material."""

    if context:
        return f"""{system_prompt}

Relevant context from the student's documents:
{context}

Student's message: {user_message}

Respond as a Socratic tutor, guiding the student with questions rather than direct answers."""
    
    return f"""{system_prompt}

Student's message: {user_message}

Respond as a Socratic tutor, guiding the student with questions rather than direct answers."""


async def call_groq(prompt: str, api_key: str) -> str:
    """Call Groq API for chat completion."""
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


@app.post("/chat")
async def chat(data: ChatMessage, user: dict = Depends(require_auth)) -> ChatResponse:
    user_email = user["email"]
    
    # Get Groq API key from env or saved settings
    user_keys = api_keys_db.get(user_email, {})
    api_key = os.environ.get("GROQ_API_KEY") or user_keys.get("groq")
    
    if not api_key:
        raise HTTPException(
            status_code=400, 
            detail="No Groq API key configured. Please set GROQ_API_KEY or add your Groq key in settings."
        )
    
    # Get context from documents if specified
    context = ""
    sources = []
    if data.document_ids:
        user_docs = documents_db.get(user_email, {})
        for doc_id in data.document_ids:
            if doc_id in user_docs:
                doc = user_docs[doc_id]
                context += f"\n--- From {doc['name']} ---\n{doc['text'][:2000]}\n"
                sources.append({"id": doc_id, "name": doc["name"]})
    
    # TODO: In production, use Pinecone for semantic search
    # query_embedding = embed_text(data.message)
    # results = pinecone_index.query(query_embedding, namespace=user_email, top_k=5)
    # context = format_results(results)
    
    # Generate Socratic prompt
    prompt = generate_socratic_prompt(data.message, context)
    
    # Call Groq only
    response_text = await call_groq(prompt, api_key)
    
    # Manage session
    session_id = data.session_id or hashlib.md5(f"{user_email}{datetime.utcnow()}".encode()).hexdigest()[:12]
    
    if user_email not in chat_sessions_db:
        chat_sessions_db[user_email] = {}
    
    if session_id not in chat_sessions_db[user_email]:
        chat_sessions_db[user_email][session_id] = {
            "id": session_id,
            "title": data.message[:50] + "..." if len(data.message) > 50 else data.message,
            "messages": [],
            "created_at": datetime.utcnow().isoformat(),
        }
    
    # Add messages to session
    chat_sessions_db[user_email][session_id]["messages"].extend([
        {"role": "user", "content": data.message, "timestamp": datetime.utcnow().isoformat()},
        {"role": "assistant", "content": response_text, "timestamp": datetime.utcnow().isoformat()},
    ])
    
    return ChatResponse(
        response=response_text,
        session_id=session_id,
        sources=sources,
    )


@app.get("/chat/sessions")
async def list_sessions(user: dict = Depends(require_auth)) -> dict:
    user_email = user["email"]
    sessions = chat_sessions_db.get(user_email, {})
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


@app.get("/chat/sessions/{session_id}")
async def get_session(session_id: str, user: dict = Depends(require_auth)) -> dict:
    user_email = user["email"]
    sessions = chat_sessions_db.get(user_email, {})
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id]


@app.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(require_auth)) -> dict:
    user_email = user["email"]
    if user_email in chat_sessions_db and session_id in chat_sessions_db[user_email]:
        del chat_sessions_db[user_email][session_id]
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Session not found")


# ============== Analytics Routes ==============

@app.get("/analytics")
async def get_analytics(user: dict = Depends(require_auth)) -> dict:
    user_email = user["email"]
    docs = documents_db.get(user_email, {})
    sessions = chat_sessions_db.get(user_email, {})
    
    total_messages = sum(len(s["messages"]) for s in sessions.values())
    
    return {
        "documents_count": len(docs),
        "sessions_count": len(sessions),
        "total_messages": total_messages,
    }


# ============== Health Check ==============

@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "socratic-tutor-api"}
