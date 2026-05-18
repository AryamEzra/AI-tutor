"""
Audio service using gTTS (Google Text-to-Speech).
Completely free — no API key, no account, no limits beyond fair use.
"""

import io
import re
from gtts import gTTS


def text_to_audio(text: str, lang: str = "en") -> bytes:
    """Convert text to MP3 audio bytes using gTTS."""
    # Clean text — remove markdown symbols that would be read aloud
    clean = re.sub(r"[#*_`>\-]{2,}", " ", text)
    clean = re.sub(r"\s+", " ", clean).strip()

    # gTTS has a ~5000 char limit per request; chunk if needed
    chunks = _chunk_text(clean, max_chars=4000)
    audio_bytes = io.BytesIO()

    for chunk in chunks:
        tts = gTTS(text=chunk, lang=lang, slow=False)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        audio_bytes.write(buf.getvalue())

    return audio_bytes.getvalue()


def _chunk_text(text: str, max_chars: int = 4000) -> list[str]:
    """Split text into sentence-aware chunks."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""
    for sentence in sentences:
        if len(current) + len(sentence) > max_chars:
            if current:
                chunks.append(current.strip())
            current = sentence
        else:
            current += " " + sentence
    if current.strip():
        chunks.append(current.strip())
    return chunks or [text[:max_chars]]