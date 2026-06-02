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
    api_key = settings.SARVAM_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SARVAM_API_KEY environment variable is not configured."
        )

    # Base System Prompt instructing the model to auto-detect language and respond in it
    system_instruction = (
        "You are CivilVerge Assistant, an AI assistant for a citizen grievance portal in Jammu. "
        "Help users submit complaints, understand categories, track complaint status, and navigate the platform. "
        "Support English, Hindi, Urdu, and Dogri. Auto-detect the user's language and respond in the same language. "
        "Respond clearly and politely. Do not make up information. Keep answers short and simple."
    )

    # Format the message history for Sarvam AI (OpenAI-compatible)
    messages = [{"role": "system", "content": system_instruction}]

    for idx, msg in enumerate(payload.history):
        # Skip the initial welcome message from the history context to avoid confusion
        if msg.role == "bot" and idx == 0:
            continue
        messages.append({
            "role": "assistant" if msg.role == "bot" else "user",
            "content": msg.text
        })

    # Append current message
    messages.append({
        "role": "user",
        "content": payload.message
    })

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Model parameters for Sarvam AI Chat completion (sarvam-30b is Indian language optimized)
    request_data = {
        "model": "sarvam-30b",
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": 500
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(SARVAM_API_URL, json=request_data, headers=headers)
            
            if response.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Sarvam AI Rate Limit exceeded. Please try again later."
                )
            
            if response.status_code != 200:
                error_text = response.text
                try:
                    error_json = response.json()
                    error_text = error_json.get("error", {}).get("message", error_text)
                except Exception:
                    pass
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Sarvam AI Error: {error_text}"
                )

            result = response.json()
            reply = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not reply:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Empty response received from Sarvam AI."
                )
            return {"reply": reply}

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to communicate with Sarvam AI service: {str(e)}"
        )
