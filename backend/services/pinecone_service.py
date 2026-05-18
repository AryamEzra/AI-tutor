"""
Pinecone service using Pinecone's built-in inference API for embeddings.
Model: multilingual-e5-large (free, no separate embeddings provider needed).
"""

from typing import Optional
from pinecone import Pinecone

from config import PINECONE_API_KEY, PINECONE_INDEX_NAME

_pc: Optional[Pinecone] = None
_index = None


def get_pinecone():
    """Lazy-init Pinecone client."""
    global _pc, _index
    if _pc is None:
        if not PINECONE_API_KEY:
            raise RuntimeError("PINECONE_API_KEY not set")
        _pc = Pinecone(api_key=PINECONE_API_KEY)
        _index = _pc.Index(PINECONE_INDEX_NAME)
    return _pc, _index


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts using Pinecone inference API."""
    pc, _ = get_pinecone()
    result = pc.inference.embed(
        model="multilingual-e5-large",
        inputs=texts,
        parameters={"input_type": "passage", "truncate": "END"},
    )
    return [item.values for item in result.data]


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    pc, _ = get_pinecone()
    result = pc.inference.embed(
        model="multilingual-e5-large",
        inputs=[query],
        parameters={"input_type": "query", "truncate": "END"},
    )
    return result.data[0].values


def upsert_document(
    doc_id: str,
    text: str,
    namespace: str,
    metadata: dict,
) -> int:
    """Chunk, embed and upsert a document into Pinecone. Returns chunk count."""
    _, index = get_pinecone()

    chunks = chunk_text(text)
    if not chunks:
        return 0

    embeddings = embed_texts(chunks)

    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"{doc_id}_chunk_{i}",
            "values": embedding,
            "metadata": {
                **metadata,
                "doc_id": doc_id,
                "chunk_index": i,
                "text": chunk[:1000],   # store snippet for retrieval
            },
        })

    # Upsert in batches of 100
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        index.upsert(vectors=vectors[i : i + batch_size], namespace=namespace)

    return len(chunks)


def query_documents(
    query: str,
    namespace: str,
    doc_ids: Optional[list[str]] = None,
    top_k: int = 5,
) -> list[dict]:
    """
    Semantic search in Pinecone.
    Optionally filter to specific doc_ids.
    Returns list of {doc_id, text, score, name} dicts.
    """
    _, index = get_pinecone()

    query_embedding = embed_query(query)

    filter_expr = None
    if doc_ids:
        filter_expr = {"doc_id": {"$in": doc_ids}}

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        namespace=namespace,
        include_metadata=True,
        filter=filter_expr,
    )

    chunks = []
    for match in results.matches:
        meta = match.metadata or {}
        chunks.append({
            "doc_id": meta.get("doc_id", ""),
            "name": meta.get("name", "Unknown"),
            "text": meta.get("text", ""),
            "score": round(match.score, 3),
        })

    return chunks


def delete_document(doc_id: str, namespace: str, chunk_count: int) -> None:
    """Delete all chunks for a document from Pinecone."""
    _, index = get_pinecone()
    ids = [f"{doc_id}_chunk_{i}" for i in range(chunk_count)]
    index.delete(ids=ids, namespace=namespace)


def pinecone_healthy() -> bool:
    """Quick health check - returns True if index is reachable."""
    try:
        _, index = get_pinecone()
        index.describe_index_stats()
        return True
    except Exception:
        return False