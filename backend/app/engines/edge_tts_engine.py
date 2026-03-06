from typing import List, Dict, Optional

import edge_tts

from app.engines.base import TTSEngine, TTSResult

DEFAULT_VOICES = {
    "vi": {"female": "vi-VN-HoaiMyNeural", "male": "vi-VN-NamMinhNeural"},
    "en": {"female": "en-US-JennyNeural", "male": "en-US-GuyNeural"},
    "ja": {"female": "ja-JP-NanamiNeural", "male": "ja-JP-KeitaNeural"},
}


class EdgeTTSEngine(TTSEngine):
    """Free TTS engine using Microsoft Edge TTS."""

    async def synthesize(
        self,
        text: str,
        language: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 0,
        output_format: str = "mp3",
    ) -> TTSResult:
        rate = f"{int((speed - 1) * 100):+d}%"
        pitch_str = f"{int(pitch):+d}Hz"

        communicate = edge_tts.Communicate(
            text=text, voice=voice_id, rate=rate, pitch=pitch_str
        )

        audio_chunks: List[bytes] = []
        word_timestamps: List[Dict] = []

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                word_timestamps.append(
                    {
                        "word": chunk["text"],
                        "start": chunk["offset"] / 10_000,
                        "end": (chunk["offset"] + chunk["duration"]) / 10_000,
                    }
                )

        return TTSResult(
            audio_data=b"".join(audio_chunks),
            duration_ms=int(word_timestamps[-1]["end"]) if word_timestamps else 0,
            format="mp3",
            word_timestamps=word_timestamps,
        )

    async def list_voices(self, language: Optional[str] = None) -> List[Dict]:
        voices = await edge_tts.list_voices()

        if language:
            lang_prefix = {"vi": "vi-", "en": "en-", "ja": "ja-"}
            prefix = lang_prefix.get(language, "")
            voices = [v for v in voices if v["ShortName"].startswith(prefix)]

        return [
            {
                "id": v["ShortName"],
                "name": v["FriendlyName"],
                "language": v["Locale"],
                "gender": v["Gender"],
            }
            for v in voices
        ]
