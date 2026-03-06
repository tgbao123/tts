"""Google Cloud TTS Engine — Enterprise tier."""
from typing import Optional, List, Dict
from app.engines.base import TTSEngine, TTSResult


class GoogleTTSEngine(TTSEngine):
    """Google Cloud Text-to-Speech — highest quality, requires API key."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from google.cloud import texttospeech
                self._client = texttospeech.TextToSpeechAsyncClient()
            except ImportError:
                raise RuntimeError("google-cloud-texttospeech not installed")
        return self._client

    async def synthesize(
        self, text: str, language: str, voice_id: str,
        speed: float = 1.0, pitch: float = 0,
        output_format: str = "mp3",
    ) -> TTSResult:
        from google.cloud import texttospeech

        client = self._get_client()
        lang_map = {"vi": "vi-VN", "en": "en-US", "ja": "ja-JP"}

        response = await client.synthesize_speech(
            input=texttospeech.SynthesisInput(text=text),
            voice=texttospeech.VoiceSelectionParams(
                language_code=lang_map.get(language, language),
                name=voice_id,
            ),
            audio_config=texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speed,
                pitch=pitch,
            ),
        )
        return TTSResult(
            audio_data=response.audio_content,
            duration_ms=0,
            format="mp3",
            word_timestamps=[],
        )

    async def list_voices(self, language: Optional[str] = None) -> List[Dict]:
        from google.cloud import texttospeech

        client = self._get_client()
        lang_map = {"vi": "vi-VN", "en": "en-US", "ja": "ja-JP"}
        response = await client.list_voices(
            language_code=lang_map.get(language, "") if language else ""
        )
        return [
            {
                "id": v.name,
                "name": v.name,
                "language": v.language_codes[0] if v.language_codes else "",
                "gender": v.ssml_gender.name,
            }
            for v in response.voices
        ]

    def supports_voice_cloning(self) -> bool:
        return False
