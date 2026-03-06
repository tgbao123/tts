from typing import Optional

from fastapi import APIRouter, Query

from app.engines.router import get_engine

router = APIRouter()


@router.get("/voices")
async def list_voices(language: Optional[str] = Query(None, regex="^(vi|en|ja)$")):
    """List available TTS voices, optionally filtered by language."""
    engine = get_engine("edge_tts")
    voices = await engine.list_voices(language=language)
    return {"voices": voices, "total": len(voices)}
