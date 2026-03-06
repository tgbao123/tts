"""API key management and usage tracking — Supabase backed."""
from typing import Optional, Dict
from uuid import uuid4
from datetime import date, datetime
import secrets

from fastapi import APIRouter, HTTPException

from app.services.db import get_supabase

router = APIRouter()


def _generate_api_key() -> str:
    return f"vs_live_{secrets.token_hex(16)}"


@router.post("/api-keys")
async def create_api_key(name: str = "Default"):
    """Generate a new API key."""
    key = _generate_api_key()
    record = {
        "name": name,
        "key": key,
        "key_preview": key[:12] + "...",
    }
    result = get_supabase().table("api_keys").insert(record).execute()
    return result.data[0] if result.data else record


@router.get("/api-keys")
async def list_api_keys():
    """List all API keys (masked)."""
    result = get_supabase().table("api_keys").select("id,name,key_preview,created_at,last_used").order("created_at", desc=True).execute()
    keys = result.data or []
    return {"keys": keys, "total": len(keys)}


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str):
    """Revoke an API key."""
    result = get_supabase().table("api_keys").delete().eq("id", key_id).execute()
    if not result.data:
        raise HTTPException(404, "API key not found")
    return {"status": "revoked", "id": key_id}


def verify_api_key(key: str) -> Optional[Dict]:
    """Verify API key."""
    result = get_supabase().table("api_keys").select("*").eq("key", key).execute()
    if result.data:
        get_supabase().table("api_keys").update({"last_used": datetime.now().isoformat()}).eq("id", result.data[0]["id"]).execute()
        return result.data[0]
    return None


# === Usage Tracking ===

def track_usage(char_count: int, engine: str = "edge_tts"):
    """Track daily usage."""
    today = date.today().isoformat()
    existing = get_supabase().table("usage_logs").select("*").eq("date", today).eq("engine", engine).execute()
    if existing.data:
        row = existing.data[0]
        get_supabase().table("usage_logs").update({
            "char_count": row["char_count"] + char_count,
            "request_count": row["request_count"] + 1,
        }).eq("id", row["id"]).execute()
    else:
        get_supabase().table("usage_logs").insert({
            "date": today,
            "engine": engine,
            "char_count": char_count,
            "request_count": 1,
        }).execute()


@router.get("/usage")
async def get_usage(days: int = 7):
    """Get usage stats."""
    result = get_supabase().table("usage_logs").select("*").order("date", desc=True).limit(days).execute()
    logs = result.data or []
    total_chars = sum(l["char_count"] for l in logs)
    total_requests = sum(l["request_count"] for l in logs)
    return {"total_chars": total_chars, "total_requests": total_requests, "daily": logs}
