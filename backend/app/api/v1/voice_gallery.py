"""Voice gallery API — list available TTS voices."""
from typing import Optional

from fastapi import APIRouter

from app.engines.router import get_engine

router = APIRouter()


@router.get("/voices/gallery")
async def voice_gallery(language: Optional[str] = None):
    """List voices for gallery — real edge_tts voices (VI + EN only)."""
    LANG_PREFIXES = {"vi-": "vi", "en-": "en"}

    engine = get_engine("edge_tts")
    all_voices = await engine.list_voices(language=language)

    voices = []
    for v in all_voices:
        raw_lang = v.get("language", v.get("Locale", ""))
        short_lang = None
        for prefix, code in LANG_PREFIXES.items():
            if raw_lang.startswith(prefix):
                short_lang = code
                break
        if not short_lang:
            continue

        if language and short_lang != language:
            continue

        voices.append({
            "id": v.get("id", v.get("ShortName", "")),
            "name": v.get("name", v.get("FriendlyName", "")),
            "language": short_lang,
            "gender": v.get("gender", v.get("Gender", "Unknown")),
            "engine": "edge_tts",
            "badge": "Neural",
        })

    return {"voices": voices, "total": len(voices)}
