import os
import aiofiles

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "audio_files")


async def upload_audio(file_path: str, audio_data: bytes) -> None:
    """Save audio to local storage (Supabase Storage in production)."""
    full_path = os.path.join(AUDIO_DIR, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    async with aiofiles.open(full_path, "wb") as f:
        await f.write(audio_data)


async def get_audio_url(file_path: str) -> str:
    """Return a URL to access the audio file."""
    return f"/audio/{file_path}"
