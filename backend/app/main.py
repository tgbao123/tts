import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.v1 import tts, voices, pronunciation, history
from app.api.v1 import voice_gallery, batch, api_keys

app = FastAPI(
    title="VoiceSensei API",
    version="2.0.0",
    description="Text-to-Speech API for Language Teaching — vi/en/ja",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phase 1
app.include_router(tts.router, prefix="/api/v1", tags=["TTS"])
app.include_router(voices.router, prefix="/api/v1", tags=["Voices"])

# Phase 2
app.include_router(pronunciation.router, prefix="/api/v1", tags=["Pronunciation"])
app.include_router(history.router, prefix="/api/v1", tags=["History"])

# Phase 3
app.include_router(voice_gallery.router, prefix="/api/v1", tags=["Voice Gallery"])

# Phase 4
app.include_router(batch.router, prefix="/api/v1", tags=["Batch"])

# Phase 5
app.include_router(api_keys.router, prefix="/api/v1", tags=["API Keys"])

# Serve audio files
audio_dir = os.path.join(os.path.dirname(__file__), "..", "audio_files")
os.makedirs(audio_dir, exist_ok=True)
app.mount("/audio", StaticFiles(directory=audio_dir), name="audio")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "voicesensei", "version": "2.0.0"}
