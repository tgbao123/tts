"""Database service — Supabase PostgreSQL."""
from typing import Dict, Optional, List
from datetime import datetime

from supabase import create_client

from app.config import settings

# Initialize Supabase client
_supabase = None


def get_supabase():
    global _supabase
    if _supabase is None:
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        else:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
    return _supabase


async def save_tts_request(
    id: str, text: str, language: str, voice_id: str,
    engine: str, speed: float, pitch: float,
    audio_path: str, char_count: int, duration_ms: int,
) -> Dict:
    """Save TTS request to Supabase."""
    record = {
        "id": id,
        "input_text": text,
        "language": language,
        "voice_id": voice_id,
        "engine": engine,
        "speed": speed,
        "pitch": pitch,
        "audio_path": audio_path,
        "char_count": char_count,
        "duration_ms": duration_ms,
        "status": "done",
        "is_favorite": False,
    }
    result = get_supabase().table("tts_requests").insert(record).execute()
    return result.data[0] if result.data else record


async def get_tts_request(tts_id: str) -> Optional[Dict]:
    """Get a TTS request by ID."""
    result = get_supabase().table("tts_requests").select("*").eq("id", tts_id).execute()
    return result.data[0] if result.data else None


def get_all_tts_requests(language: Optional[str] = None) -> List[Dict]:
    """List TTS requests, optionally filtered by language."""
    query = get_supabase().table("tts_requests").select("*").order("created_at", desc=True)
    if language:
        query = query.eq("language", language)
    result = query.limit(50).execute()
    return result.data or []


def delete_tts_request(tts_id: str) -> bool:
    """Delete a TTS request."""
    result = get_supabase().table("tts_requests").delete().eq("id", tts_id).execute()
    return len(result.data) > 0 if result.data else False


def toggle_favorite(tts_id: str) -> bool:
    """Toggle favorite status. Returns new state."""
    item = get_supabase().table("tts_requests").select("is_favorite").eq("id", tts_id).execute()
    if not item.data:
        return False
    new_state = not item.data[0]["is_favorite"]
    get_supabase().table("tts_requests").update({"is_favorite": new_state}).eq("id", tts_id).execute()
    return new_state


def get_favorites() -> List[Dict]:
    """Get all favorited TTS requests."""
    result = get_supabase().table("tts_requests").select("*").eq("is_favorite", True).order("created_at", desc=True).execute()
    return result.data or []
