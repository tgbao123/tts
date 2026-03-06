# Phase 3: Advanced TTS 🔊 (Tuần 5-7)

> Tích hợp model mạnh hơn, voice cloning.

**Yêu cầu:** Phase 2 hoàn thành.
**Kết quả mong đợi:** Giáo viên clone giọng mình, học sinh nghe giọng thầy/cô đọc mọi text.

---

## Checklist

- [ ] Fish Speech / F5-TTS integration
- [ ] Voice cloning UI + API
- [ ] Voice gallery page
- [ ] Celery task queue (async TTS)
- [ ] Audio caching (Redis)
- [ ] Rate limiting
- [ ] User tiers (Free / Pro / Enterprise)

---

## 1. Fish Speech Integration

**Lý do chọn Fish Speech:**

| Tiêu chí | Fish Speech | Coqui XTTS | F5-TTS |
|----------|-------------|------------|--------|
| Voice cloning | ✅ Zero-shot | ✅ 6s sample | ✅ Zero-shot |
| VI/EN/JA support | ✅ | ✅ | ✅ |
| Tốc độ inference | Nhanh | Chậm | Trung bình |
| VRAM cần | ~4GB | ~6GB | ~4GB |
| License | Apache 2.0 | CPML | MIT |

**Cách chạy:** Fish Speech as inference server (HTTP API).

```bash
# Docker cho Fish Speech
docker run -d --gpus all \
  -p 8080:8080 \
  fishaudio/fish-speech:latest \
  --listen 0.0.0.0:8080
```

**`app/engines/fish_speech.py`:**

```python
import httpx
from app.engines.base import TTSEngine, TTSResult

class FishSpeechEngine(TTSEngine):
    def __init__(self, base_url: str = "http://fish-speech:8080"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60)

    async def synthesize(self, text, language, voice_id, speed=1.0, pitch=0, output_format="mp3") -> TTSResult:
        response = await self.client.post(
            f"{self.base_url}/v1/tts",
            json={
                "text": text,
                "reference_id": voice_id,  # cloned voice ID
                "speed": speed,
            },
        )
        return TTSResult(
            audio_data=response.content,
            duration_ms=0,
            format="wav",
        )

    async def list_voices(self, language=None):
        response = await self.client.get(f"{self.base_url}/v1/models")
        return response.json()

    def supports_voice_cloning(self):
        return True
```

---

## 2. Voice Cloning

### Flow

```
1. User upload audio (10-30 giây giọng nói rõ ràng)
2. Backend gửi audio → Fish Speech để tạo voice reference
3. Lưu voice profile vào Supabase
4. User chọn giọng clone → TTS text bất kỳ
```

### API

```
POST /api/v1/voices/clone
  - Multipart: audio file (WAV/MP3, 10-30s)
  - Body: { "name": "Giọng thầy Minh", "language": "vi" }
  - Response: { "voice_id": "uuid", "name": "...", "status": "ready" }
```

### Backend Logic

```python
@router.post("/voices/clone")
async def clone_voice(
    audio: UploadFile,
    name: str = Form(...),
    language: str = Form(...),
    user = Depends(verify_token),
):
    # 1. Upload audio sample lên Supabase Storage
    sample_path = f"voice_samples/{user.id}/{uuid4()}.wav"
    supabase.storage.from_("audio").upload(sample_path, await audio.read())

    # 2. Gửi cho Fish Speech tạo reference
    fish = FishSpeechEngine()
    reference_id = await fish.create_reference(audio_data)

    # 3. Lưu voice profile
    profile = supabase.table("voice_profiles").insert({
        "user_id": user.id,
        "name": name,
        "language": language,
        "engine": "fish_speech",
        "engine_voice_id": reference_id,
        "sample_audio_path": sample_path,
        "is_cloned": True,
        "is_public": False,
    }).execute()

    return profile.data[0]
```

---

## 3. Voice Gallery

**Frontend:** `app/voices/page.tsx`

- Grid/list các giọng có sẵn
- Tabs: **Mặc định** · **Community** · **Giọng của tôi**
- Mỗi voice card:
  - Avatar/icon
  - Tên + ngôn ngữ
  - Badge: "Cloned" / "AI" / "Neural"
  - Nút ▶️ preview
  - Nút "Sử dụng" → redirect studio với voice_id

---

## 4. Celery Task Queue

**Lý do:** Fish Speech inference mất 5-30s. Không thể block API request.

```python
# app/tasks/tts_task.py
from celery import Celery

celery_app = Celery("voicesensei", broker="redis://redis:6379/0")

@celery_app.task
def process_tts(request_id: str, text: str, voice_id: str, engine: str, **kwargs):
    """Async TTS processing cho model nặng."""
    # 1. Update status = "processing"
    supabase.table("tts_requests").update({"status": "processing"}).eq("id", request_id).execute()

    # 2. Synthesize
    engine_instance = get_engine(engine)
    result = engine_instance.synthesize_sync(text, voice_id=voice_id, **kwargs)

    # 3. Upload audio
    supabase.storage.from_("audio").upload(f"{request_id}.mp3", result.audio_data)

    # 4. Update status = "done"
    supabase.table("tts_requests").update({
        "status": "done",
        "audio_path": f"{request_id}.mp3",
        "duration_ms": result.duration_ms,
    }).eq("id", request_id).execute()
```

**Frontend polling:**

```typescript
// Poll status cho async requests
const pollStatus = async (id: string) => {
  const interval = setInterval(async () => {
    const res = await api.get(`/tts/${id}`);
    if (res.status === "done") {
      clearInterval(interval);
      setAudioUrl(res.audio_url);
    }
  }, 2000);
};
```

---

## 5. Audio Caching (Redis)

```python
# Cache key = hash(text + voice_id + speed + pitch)
import hashlib, redis

redis_client = redis.Redis(host="redis", port=6379, db=1)

def get_cache_key(text, voice_id, speed, pitch):
    raw = f"{text}|{voice_id}|{speed}|{pitch}"
    return f"tts:{hashlib.md5(raw.encode()).hexdigest()}"

async def get_or_synthesize(text, voice_id, speed, pitch, engine):
    key = get_cache_key(text, voice_id, speed, pitch)
    cached = redis_client.get(key)
    if cached:
        return cached  # return cached audio URL

    result = await engine.synthesize(text, voice_id=voice_id, speed=speed, pitch=pitch)
    redis_client.setex(key, 86400, result.audio_url)  # cache 24h
    return result
```

---

## 6. Rate Limiting & User Tiers

| Tier | Requests/ngày | Voice clone | Engine | Giá |
|------|--------------|-------------|--------|-----|
| **Free** | 50 | ❌ | Edge TTS | $0 |
| **Pro** | Unlimited | ✅ 5 voices | Fish Speech | $9/tháng |
| **Enterprise** | Unlimited | ✅ Unlimited | Google Cloud TTS | $29/tháng |

**Middleware rate limiting:**

```python
from fastapi import Request
from datetime import date

async def check_rate_limit(request: Request, user):
    if user.tier != "free":
        return  # no limit

    today = date.today().isoformat()
    key = f"rate:{user.id}:{today}"
    count = redis_client.incr(key)
    redis_client.expire(key, 86400)

    if count > 50:
        raise HTTPException(429, "Daily limit reached. Upgrade to Pro.")
```

---

## Docker Compose bổ sung

```yaml
# Thêm vào docker-compose.yml
services:
  # ... (existing services)

  fish-speech:
    image: fishaudio/fish-speech:latest
    ports:
      - "8080:8080"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  celery-worker:
    build: ./backend
    command: celery -A app.tasks.tts_task worker --loglevel=info
    env_file: .env
    depends_on:
      - redis
      - fish-speech
```

---

## Verification

| Test | Hành động | Kết quả |
|------|-----------|---------|
| Fish Speech TTS | TTS với engine=fish_speech | Audio chất lượng cao |
| Voice clone | Upload 15s audio → clone → TTS | Giọng giống mẫu |
| Voice gallery | Mở /voices | Thấy danh sách voices |
| Async TTS | TTS với model nặng | Status: pending → processing → done |
| Cache hit | TTS cùng text+voice 2 lần | Lần 2 nhanh hơn nhiều |
| Rate limit free | Gửi 51 requests (free user) | Request 51 bị 429 |
| Rate limit pro | Gửi 100 requests (pro user) | Tất cả OK |
