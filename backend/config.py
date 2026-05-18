import os
from dotenv import load_dotenv

load_dotenv()

# JWT
SECRET_KEY = os.environ.get("JWT_SECRET", "change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Groq
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Pinecone
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "ai-tutor")

# Groq models available (all free)
GROQ_MODELS = {
    "llama-3.3-70b": "llama-3.3-70b-versatile",
    "llama-3.1-8b": "llama-3.1-8b-instant",
    "mixtral-8x7b": "mixtral-8x7b-32768",
    "gemma2-9b": "gemma2-9b-it",
}

DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"