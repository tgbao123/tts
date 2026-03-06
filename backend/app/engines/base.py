from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Optional


@dataclass
class TTSResult:
    audio_data: bytes
    duration_ms: int
    format: str
    word_timestamps: List[Dict] = field(default_factory=list)


class TTSEngine(ABC):
    """Abstract base for all TTS engines."""

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        language: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 0,
        output_format: str = "mp3",
    ) -> TTSResult: ...

    @abstractmethod
    async def list_voices(self, language: Optional[str] = None) -> List[Dict]: ...
