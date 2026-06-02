import json
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

model = genai.GenerativeModel(
    "gemini-1.5-pro",
    generation_config={
        "response_mime_type": "application/json"
    }
)

def triage_report(title: str, description: str, category: str):
    prompt = f"""
    You are an AI triage engine for a city reporting system.
    Analyze the following report:
    Title: {title}
    Description: {description}
    Category: {category}

    Please provide:
    1. A short, 1-2 sentence summary of the issue (ai_summary)
    2. A priority level (priority): choose exactly one of [low, medium, high, critical]
    3. A department suggestion (department_name): choose exactly one of [Roads, Water, Sanitation, Parks, Electricity, Noise]

    Respond in valid JSON format:
    {{
      "ai_summary": "summary text here",
      "priority": "one of low, medium, high, critical",
      "department_name": "one of Roads, Water, Sanitation, Parks, Electricity, Noise"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Error during AI triage: {e}")
        return {
            "ai_summary": "AI triage failed.",
            "priority": "medium",
            "department_name": None
        }
