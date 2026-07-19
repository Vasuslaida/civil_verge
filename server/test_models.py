import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

print("API Key:", settings.GEMINI_API_KEY[:10] + "...")

print("\nAvailable models:\n")

for model in genai.list_models():
    print(model.name)
    print("Methods:", model.supported_generation_methods)
    print("-" * 50)