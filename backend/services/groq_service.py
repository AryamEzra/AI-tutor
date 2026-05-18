"""
Groq service for chat completions.
All models listed here are on Groq's free tier.
"""

from fastapi import HTTPException
from groq import Groq

from config import DEFAULT_GROQ_MODEL


AVAILABLE_MODELS = {
    "llama-3.3-70b": "llama-3.3-70b-versatile",
    "llama-3.1-8b": "llama-3.1-8b-instant",
    "mixtral-8x7b": "mixtral-8x7b-32768",
    "gemma2-9b": "gemma2-9b-it",
}


def build_socratic_prompt(user_message: str, context: str = "") -> list[dict]:
    """Build messages array for Groq with Socratic tutor system prompt."""
    system = (
        "You are a Socratic tutor. Help students learn through guided questioning, "
        "never by giving direct answers.\n\n"
        "Rules:\n"
        "1. Always respond with questions that guide the student toward the answer.\n"
        "2. Ask clarifying questions to gauge what the student already knows.\n"
        "3. Break complex topics into smaller questions.\n"
        "4. Validate correct reasoning; gently redirect incorrect reasoning.\n"
        "5. When document context is provided, base your questions on that material."
    )

    user_content = user_message
    if context:
        user_content = (
            f"Relevant context from my documents:\n{context}\n\n"
            f"My question: {user_message}"
        )

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]


async def chat_completion(
    user_message: str,
    api_key: str,
    context: str = "",
    model: str | None = None,
) -> str:
    """Call Groq and return the assistant reply."""
    model_id = AVAILABLE_MODELS.get(model or "", DEFAULT_GROQ_MODEL)

    try:
        client = Groq(api_key=api_key)
        messages = build_socratic_prompt(user_message, context)
        response = client.chat.completions.create(
            model=model_id,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {str(e)}")