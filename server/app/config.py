from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/civil_verge"
    JWT_SECRET: str = "supersecretkey123"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    SARVAM_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
print("Loaded Gemini Key:", repr(settings.GEMINI_API_KEY))
