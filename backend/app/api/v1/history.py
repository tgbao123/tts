from typing import Optional, List, Dict

from fastapi import APIRouter, Query, HTTPException

from app.services.db import get_all_tts_requests, get_tts_request, delete_tts_request, toggle_favorite, get_favorites

router = APIRouter()


@router.get("/history")
async def list_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    language: Optional[str] = Query(None, regex="^(vi|en|ja)$"),
):
    """List TTS history (paginated)."""
    items = get_all_tts_requests(language=language)
    total = len(items)

    start = (page - 1) * limit
    end = start + limit
    page_items = items[start:end]

    return {
        "items": page_items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.delete("/history/{tts_id}")
async def delete_history_item(tts_id: str):
    """Delete a TTS history item."""
    success = delete_tts_request(tts_id)
    if not success:
        raise HTTPException(404, "Item not found")
    return {"status": "deleted", "id": tts_id}


@router.post("/favorites/{tts_id}")
async def toggle_favorite_item(tts_id: str):
    """Toggle favorite on a TTS item."""
    is_fav = toggle_favorite(tts_id)
    return {"id": tts_id, "is_favorite": is_fav}


@router.get("/favorites")
async def list_favorites(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List favorite TTS items."""
    items = get_favorites()
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    return {
        "items": items[start:end],
        "total": total,
        "page": page,
        "limit": limit,
    }
