import os
import secrets
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

def get_or_generate_secret_key() -> str:
    # First priority: Environment secret key
    env_key = os.getenv("SECRET_KEY")
    if env_key and env_key != "super-secret-key-ops-pilot-premium-token-cryptography-98234":
        return env_key
    
    # Second priority: Cache generated secure key in a local private file
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    secret_file = os.path.join(backend_dir, ".secret_key")
    if os.path.exists(secret_file):
        try:
            with open(secret_file, "r") as f:
                cached_key = f.read().strip()
                if cached_key:
                    return cached_key
        except Exception:
            pass
            
    # Fallback: Generate a high-entropy cryptographically secure random key
    generated_key = secrets.token_hex(32)
    try:
        with open(secret_file, "w") as f:
            f.write(generated_key)
    except Exception:
        # Fallback if file system is read-only
        pass
    return generated_key

class Settings(BaseSettings):
    PROJECT_NAME: str = "OpsPilot Operational Intelligence API"
    API_V1_STR: str = "/api/v1"
    
    # Secure dynamic rotation settings key
    SECRET_KEY: str = get_or_generate_secret_key()
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # Enforce tighter default of 1 day (1440 minutes)

    # Postgres User-space DB Port
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres@localhost:5433/opspilot"
    )

    # Gemini API Key for LIVE AI coordinator responses
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)

    # Restrictive CORS origins default
    BACKEND_CORS_ORIGINS: List[str] = [
        origin.strip().strip('"').strip("'").rstrip('/')
        for origin in os.getenv("BACKEND_CORS_ORIGINS", "").split(",")
        if origin.strip()
    ] if os.getenv("BACKEND_CORS_ORIGINS") else [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://127.0.0.1",
    ]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
