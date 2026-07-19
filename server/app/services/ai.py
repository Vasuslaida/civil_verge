import json
from google import genai
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def triage_report(title: str, description: str, category: str):
    prompt = f"""
You are an AI triage engine for a city reporting system.

Analyze this report:

Title: {title}
Description: {description}
Category: {category}

Return ONLY valid JSON:

{{
    "ai_summary": "short summary",
    "priority": "low|medium|high|critical",
    "department_name": "Roads|Water|Sanitation|Parks|Electricity|Noise"
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )

        print(response.text)

        return json.loads(response.text)

    except Exception as e:
        print("ERROR:", e)

        return {
            "ai_summary": "AI triage failed.",
            "priority": "medium",
            "department_name": None,
        }