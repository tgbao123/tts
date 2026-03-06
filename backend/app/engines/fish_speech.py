"""Fish Speech TTS Engine — requires Fish Speech server (GPU)."""
from typing import Optional, List, Dict
import httpx
from app.engines.base import TTSEngine, TTSResult


class FishSpeechEngine(TTSEngine):
    """Fish Speech — zero-shot voice cloning, requires GPU server."""

    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60)
        self._available = False

    async def check_available(self) -> bool:
        try:
            r = await self.client.get(f"{self.base_url}/health", timeout=3)
            self._available = r.status_code == 200
        except Exception:
            self._available = False
        return self._available

    async def synthesize(
        self, text: str, language: str, voice_id: str,
        speed: float = 1.0, pitch: float = 0,
        output_format: str = "mp3",
    ) -> TTSResult:
        response = await self.client.post(
            f"{self.base_url}/v1/tts",
            json={
                "text": text,
                "reference_id": voice_id,
                "speed": speed,
                "language": language,
            },
        )
        response.raise_for_status()
        return TTSResult(
            audio_data=response.content,
            duration_ms=0,
            format="wav",
            word_timestamps=[],
        )

    async def list_voices(self, language: Optional[str] = None) -> List[Dict]:
        try:
            response = await self.client.get(f"{self.base_url}/v1/models")
            return response.json()
        except Exception:
            return []

    def supports_voice_cloning(self) -> bool:
        return True

    async def create_reference(self, audio_data: bytes, name: str = "") -> str:
        """Upload audio sample → create voice reference."""
        response = await self.client.post(
            f"{self.base_url}/v1/models",
            files={"audio": ("sample.wav", audio_data, "audio/wav")},
            data={"name": name},
        )
        response.raise_for_status()
        return response.json().get("id", "")
