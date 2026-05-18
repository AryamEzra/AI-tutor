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

# Groq models
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"  # free vision model on Groq