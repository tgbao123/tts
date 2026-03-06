"""Audio caching and rate limiting services."""
from typing import Optional, Dict
from datetime import date
import hashlib


class CacheService:
    """In-memory audio cache (→ Redis later)."""

    def __init__(self):
        self._cache: Dict[str, str] = {}

    def get_key(self, text: str, voice_id: str, speed: float, pitch: float) -> str:
        raw = f"{text}|{voice_id}|{speed}|{pitch}"
        return f"tts:{hashlib.md5(raw.encode()).hexdigest()}"

    def get(self, key: str) -> Optional[str]:
        return self._cache.get(key)

    def set(self, key: str, audio_url: str, ttl: int = 86400) -> None:
        self._cache[key] = audio_url

    def clear(self) -> None:
        self._cache.clear()

    @property
    def size(self) -> int:
        return len(self._cache)


class RateLimiter:
    """In-memory rate limiter per user/day (→ Redis later)."""

    TIER_LIMITS = {
        "free": 50,
        "pro": 99999,
        "enterprise": 99999,
    }

    def __init__(self):
        self._counts: Dict[str, int] = {}

    def _key(self, user_id: str) -> str:
        return f"rate:{user_id}:{date.today().isoformat()}"

    def check(self, user_id: str, tier: str = "free") -> bool:
        """Returns True if allowed, raises if limit exceeded."""
        key = self._key(user_id)
        count = self._counts.get(key, 0)
        limit = self.TIER_LIMITS.get(tier, 50)
        return count < limit

    def increment(self, user_id: str) -> int:
        key = self._key(user_id)
        self._counts[key] = self._counts.get(key, 0) + 1
        return self._counts[key]

    def get_usage(self, user_id: str) -> Dict:
        key = self._key(user_id)
        count = self._counts.get(key, 0)
        return {"user_id": user_id, "date": date.today().isoformat(), "count": count}


# Singleton instances
cache_service = CacheService()
rate_limiter = RateLimiter()
