# create_index.py — place this in /d/ai-tutor/backend/
from pinecone import Pinecone, ServerlessSpec
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME

pc = Pinecone(api_key=PINECONE_API_KEY)

DIMENSION = 1024  # multilingual-e5-large outputs 1024 dims

existing = [idx.name for idx in pc.list_indexes()]

if PINECONE_INDEX_NAME not in existing:
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=DIMENSION,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
    print(f"✅ Index '{PINECONE_INDEX_NAME}' created.")
else:
    print(f"ℹ️  Index '{PINECONE_INDEX_NAME}' already exists.")