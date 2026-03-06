import uuid

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.engines.router import select_engine
from app.schemas.tts import TTSRequest, TTSResponse
from app.services.storage import upload_audio, get_audio_url
from app.services.db import save_tts_request

router = APIRouter()


@router.post("/tts", response_model=TTSResponse)
async def create_tts(request: TTSRequest):
    """Convert text to speech."""
    if len(request.text) > settings.MAX_TEXT_LENGTH:
        raise HTTPException(400, f"Text exceeds {settings.MAX_TEXT_LENGTH} chars")

    engine = select_engine(user_tier="free", engine_pref=request.engine)

    result = await engine.synthesize(
        text=request.text,
        language=request.language,
        voice_id=request.voice_id,
        speed=request.speed,
        pitch=request.pitch,
        output_format=request.format,
    )

    file_id = str(uuid.uuid4())
    file_path = f"{request.language}/{file_id}.mp3"

    await upload_audio(file_path, result.audio_data)
    audio_url = await get_audio_url(file_path)

    await save_tts_request(
        id=file_id,
        text=request.text,
        language=request.language,
        voice_id=request.voice_id,
        engine="edge_tts",
        speed=request.speed,
        pitch=request.pitch,
        audio_path=file_path,
        char_count=len(request.text),
        duration_ms=result.duration_ms,
    )

    return TTSResponse(
        id=file_id,
        status="done",
        audio_url=audio_url,
        duration_ms=result.duration_ms,
        char_count=len(request.text),
        engine_used="edge_tts",
        word_timestamps=[
            {"word": w["word"], "start": w["start"], "end": w["end"]}
            for w in result.word_timestamps
        ],
    )


@router.get("/tts/{tts_id}", response_model=TTSResponse)
async def get_tts(tts_id: str):
    """Get a TTS result by ID."""
    from app.services.db import get_tts_request

    record = await get_tts_request(tts_id)
    if not record:
        raise HTTPException(404, "TTS request not found")

    audio_url = await get_audio_url(record["audio_path"])

    return TTSResponse(
        id=record["id"],
        status=record["status"],
        audio_url=audio_url,
        duration_ms=record.get("duration_ms", 0),
        char_count=record.get("char_count", 0),
        engine_used=record.get("engine", "edge_tts"),
    )
