"""
Groq service — chat, generation, and vision (equation checking).
All models used are on Groq's free tier.
"""

import base64
from fastapi import HTTPException
from groq import Groq

from config import GROQ_API_KEY, DEFAULT_GROQ_MODEL, GROQ_VISION_MODEL


AVAILABLE_MODELS = {
    "llama-3.3-70b-versatile": "Default text model",
    "meta-llama/llama-4-scout-17b-16e-instruct": "Vision model",
}


def _client(api_key: str | None = None) -> Groq:
    key = api_key or GROQ_API_KEY
    if not key:
        raise HTTPException(status_code=400, detail="No Groq API key configured.")
    return Groq(api_key=key)


# ── Socratic chat ─────────────────────────────────────────────────────────────

SOCRATIC_SYSTEM = """You are a Socratic tutor. Guide students to answers through questions — never give direct answers.

Rules:
1. Always respond with questions that guide the student toward the answer.
2. Ask clarifying questions to gauge what the student already knows.
3. Break complex topics into smaller questions.
4. Validate correct reasoning; gently redirect incorrect reasoning.
5. When document context is provided, base your questions on that material."""


async def socratic_chat(
    message: str,
    history: list[dict],
    context: str = "",
    api_key: str | None = None,
) -> str:
    client = _client(api_key)

    system = SOCRATIC_SYSTEM
    if context:
        system += f"\n\nRelevant document context:\n{context}"

    messages = [{"role": "system", "content": system}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=DEFAULT_GROQ_MODEL,
        messages=messages,
        max_tokens=1024,
        temperature=0.7,
    )
    return response.choices[0].message.content


# ── Document generation helpers ───────────────────────────────────────────────

def _generate(prompt: str, api_key: str | None = None, max_tokens: int = 2048) -> str:
    client = _client(api_key)
    response = client.chat.completions.create(
        model=DEFAULT_GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.5,
    )
    return response.choices[0].message.content


def generate_exam(text: str, num_questions: int = 5, instructions: str = "", api_key: str | None = None) -> str:
    prompt = f"""Based on the following document, generate {num_questions} exam questions with answers.
{'Additional instructions: ' + instructions if instructions else ''}

Format each question as:
Q1: [question]
A1: [answer]

Document:
{text[:6000]}"""
    return _generate(prompt, api_key)


def generate_notes(text: str, instructions: str = "", api_key: str | None = None) -> str:
    prompt = f"""Create concise, well-structured study notes from the following document.
{'Additional instructions: ' + instructions if instructions else ''}
Use bullet points and clear headings. Focus on key concepts, definitions, and important facts.

Document:
{text[:6000]}"""
    return _generate(prompt, api_key)


def generate_flashcards(text: str, instructions: str = "", api_key: str | None = None) -> list[dict]:
    prompt = f"""Create flashcards from the following document.
{'Additional instructions: ' + instructions if instructions else ''}

Return ONLY a JSON array like this (no markdown, no explanation):
[{{"front": "question or term", "back": "answer or definition"}}, ...]

Generate at least 8 flashcards. Document:
{text[:6000]}"""
    raw = _generate(prompt, api_key)
    import json, re
    # strip markdown fences if present
    raw = re.sub(r"```json|```", "", raw).strip()
    try:
        return json.loads(raw)
    except Exception:
        return [{"front": "Error parsing flashcards", "back": raw[:200]}]


# ── Vision — equation checker ─────────────────────────────────────────────────

def check_equation(image_bytes: bytes, mime_type: str = "image/jpeg", api_key: str | None = None) -> dict:
    client = _client(api_key)
    b64 = base64.b64encode(image_bytes).decode()

    response = client.chat.completions.create(
        model=GROQ_VISION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{b64}"},
                    },
                    {
                        "type": "text",
                        "text": (
                            "You are a Socratic math tutor. Look at this equation or math problem.\n\n"
                            "1. State whether it is correct or incorrect.\n"
                            "2. If incorrect, do NOT give the answer directly. Instead, ask Socratic questions "
                            "that guide the student to find their own mistake.\n"
                            "3. Provide a step-by-step solution breakdown as hints, ending each step with a "
                            "question that prompts the student to verify their work.\n\n"
                            "Respond in JSON: {\"is_correct\": bool, \"feedback\": \"...\", \"socratic_steps\": [\"...\"]}"
                        ),
                    },
                ],
            }
        ],
        max_tokens=1024,
    )

    import json, re
    raw = response.choices[0].message.content
    raw = re.sub(r"```json|```", "", raw).strip()
    try:
        return json.loads(raw)
    except Exception:
        return {"is_correct": None, "feedback": raw, "socratic_steps": []}