"""Batch TTS processing API."""
from typing import Optional, List, Dict
from uuid import uuid4
from datetime import datetime
import io, zipfile, os

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

from app.engines.router import select_engine

router = APIRouter()

_batch_jobs: Dict[str, Dict] = {}
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "audio_files")


def _parse_text_file(content: str) -> List[str]:
    """Split text by lines or sentences."""
    lines = [l.strip() for l in content.split("\n") if l.strip()]
    return lines


def _parse_srt_file(content: str) -> List[str]:
    """Extract text lines from SRT subtitle file."""
    lines = content.split("\n")
    texts = []
    for line in lines:
        line = line.strip()
        if not line or line.isdigit() or "-->" in line:
            continue
        texts.append(line)
    return texts


@router.post("/tts/batch")
async def create_batch(
    file: UploadFile = File(...),
    language: str = Form("vi"),
    voice_id: str = Form("vi-VN-HoaiMyNeural"),
    speed: float = Form(1.0),
):
    """Upload file → batch TTS conversion."""
    content = (await file.read()).decode("utf-8", errors="ignore")
    filename = file.filename or "input.txt"

    if filename.endswith(".srt"):
        items = _parse_srt_file(content)
    else:
        items = _parse_text_file(content)

    if not items:
        raise HTTPException(400, "No text found in file")
    if len(items) > 100:
        raise HTTPException(400, "Max 100 items per batch")

    batch_id = str(uuid4())
    engine = select_engine()

    # Process all items
    results = []
    batch_dir = os.path.join(AUDIO_DIR, "batch", batch_id)
    os.makedirs(batch_dir, exist_ok=True)

    for i, text in enumerate(items):
        try:
            result = await engine.synthesize(text, language, voice_id, speed)
            audio_path = os.path.join(batch_dir, f"{i+1:03d}.mp3")
            with open(audio_path, "wb") as f:
                f.write(result.audio_data)
            results.append({
                "index": i + 1,
                "text": text[:100],
                "status": "done",
                "audio_url": f"/audio/batch/{batch_id}/{i+1:03d}.mp3",
            })
        except Exception as e:
            results.append({"index": i + 1, "text": text[:100], "status": "error", "error": str(e)})

    # Create ZIP
    zip_path = os.path.join(batch_dir, "all.zip")
    with zipfile.ZipFile(zip_path, "w") as zf:
        for i, text in enumerate(items):
            mp3_path = os.path.join(batch_dir, f"{i+1:03d}.mp3")
            if os.path.exists(mp3_path):
                zf.write(mp3_path, f"{i+1:03d}_{text[:30].replace(' ', '_')}.mp3")

    job = {
        "id": batch_id,
        "total_items": len(items),
        "completed_items": sum(1 for r in results if r["status"] == "done"),
        "status": "done",
        "items": results,
        "download_url": f"/audio/batch/{batch_id}/all.zip",
        "created_at": datetime.now().isoformat(),
    }
    _batch_jobs[batch_id] = job
    return job


@router.get("/tts/batch/{batch_id}")
async def get_batch_status(batch_id: str):
    """Get batch job status."""
    job = _batch_jobs.get(batch_id)
    if not job:
        raise HTTPException(404, "Batch not found")
    return job
