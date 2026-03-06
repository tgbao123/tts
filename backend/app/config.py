from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # App
    AUDIO_STORAGE_BUCKET: str = "audio"
    MAX_TEXT_LENGTH: int = 5000
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
