from typing import List, Optional

from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert")
    language: str = Field(..., pattern="^(vi|en|ja)$", description="Target language")
    voice_id: str = Field(default="vi-VN-HoaiMyNeural", description="Voice identifier")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed")
    pitch: float = Field(default=0, ge=-10, le=10, description="Pitch adjustment (Hz)")
    format: str = Field(default="mp3", description="Output format")
    engine: str = Field(default="auto", description="TTS engine preference")


class WordTimestamp(BaseModel):
    word: str
    start: float
    end: float


class TTSResponse(BaseModel):
    id: str
    status: str
    audio_url: str
    duration_ms: int = 0
    char_count: int
    engine_used: str
    word_timestamps: List[WordTimestamp] = []
