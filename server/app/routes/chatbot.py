import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List
from app.config import settings

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatbotRequest(BaseModel):
    message: str
    history: List[ChatMessage]


SARVAM_API_URL = "https://api.sarvam.ai/v1/chat/completions"


@router.post("")
async def chat_with_sarvam(payload: ChatbotRequest):
    print("=== CHATBOT ENDPOINT HIT ===")

    api_key = settings.SARVAM_API_KEY
    print("SARVAM KEY:", api_key[:10] + "..." if api_key else "NOT FOUND")

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SARVAM_API_KEY environment variable is not configured."
        )

    system_instruction = """
You are CivilVerge Assistant for the CivilVerge citizen grievance portal.

Your job:
- Help users submit complaints.
- Help users track complaints.
- Explain complaint categories.
- Answer questions about the CivilVerge platform.

VERY IMPORTANT LANGUAGE RULES (FOLLOW STRICTLY):

1. Detect the language of ONLY the user's latest message.
2. Reply ONLY in that language.
3. NEVER translate your answer.
4. NEVER provide the answer in two languages.
5. NEVER mix English and Hindi unless the user mixes them.
6. If the user writes completely in English, reply only in English.
7. If the user writes completely in Hindi, reply only in Hindi.
8. If the user writes in Urdu, reply only in Urdu.
9. If the user writes in Dogri, reply only in Dogri.
10. If the user writes in Punjabi, reply only in Punjabi.
11. If the user writes in Tamil, reply only in Tamil.
12. If the user writes in any other language, reply only in that language.
13. If the user mixes languages (for example Hinglish), reply in the same mixed style only.
14. Do not include English translations.
15. Do not include Hindi translations.
16. Never say "English:" or "Hindi:".
17. Return exactly one response in exactly one language.

Keep replies short, polite and helpful.
"""

    messages = [
        {
            "role": "system",
            "content": system_instruction
        }
    ]

    for idx, msg in enumerate(payload.history):
        if msg.role == "bot" and idx == 0:
            continue

        messages.append({
            "role": "assistant" if msg.role == "bot" else "user",
            "content": msg.text
        })

    messages.append({
        "role": "user",
        "content": payload.message
    })

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    request_data = {
        "model": "sarvam-30b",
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": 500
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                SARVAM_API_URL,
                json=request_data,
                headers=headers
            )

        print("Status Code:", response.status_code)
        print("Response Body:", response.text)

        if response.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Sarvam AI rate limit exceeded. Please try again later."
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.text
            )

        result = response.json()

        if "choices" not in result or not result["choices"]:
            raise HTTPException(
                status_code=502,
                detail="Invalid response received from Sarvam AI."
            )

        message = result["choices"][0].get("message", {})

        # Try normal response
        reply = message.get("content")

        # Some Sarvam models return reasoning_content instead
        if not reply:
            reply = message.get("reasoning_content")

        if not reply:
            reply = "Sorry, I couldn't generate a response."

        return {
            "reply": reply
        }

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to communicate with Sarvam AI: {str(e)}"
        )

    except Exception as e:
        print("Unexpected Error:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )