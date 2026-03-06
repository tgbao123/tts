# Phase 1: Foundation 🏗️ (Tuần 1-2)

> Setup project, core TTS flow hoạt động end-to-end.

**Kết quả mong đợi:** Nhập text → chọn ngôn ngữ → nhấn nút → nghe audio.

---

## Checklist

- [ ] Init FastAPI backend
- [ ] Init Next.js frontend
- [ ] Supabase setup (tables + RLS + storage)
- [ ] Edge TTS engine integration
- [ ] Engine abstraction layer
- [ ] Core API: `POST /api/v1/tts`
- [ ] Basic Frontend Studio page
- [ ] Docker Compose

---

## 1. Init FastAPI Backend

**Thư mục:** `backend/`

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, router mount
│   ├── config.py            # Pydantic Settings (env vars)
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── tts.py       # POST /tts, GET /tts/{id}
│   │       └── voices.py    # GET /voices
│   ├── engines/
│   │   ├── __init__.py
│   │   ├── base.py          # Abstract TTSEngine
│   │   ├── edge_tts.py      # Edge TTS implementation
│   │   └── router.py        # Engine selection logic
│   ├── models/
│   │   └── tts_request.py   # Pydantic models
│   ├── schemas/
│   │   └── tts.py           # Request/Response schemas
│   ├── services/
│   │   └── tts_service.py   # Business logic
│   └── utils/
│       └── audio.py         # Audio format conversion
├── tests/
│   ├── test_tts_api.py
│   └── test_edge_engine.py
├── requirements.txt
└── Dockerfile
```

**Dependencies (`requirements.txt`):**

```
fastapi==0.115.*
uvicorn[standard]==0.34.*
edge-tts==7.*
supabase==2.*
python-dotenv==1.*
pydantic-settings==2.*
aiofiles==24.*
python-multipart==0.0.*
```

**`app/config.py`:**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str

    # App
    AUDIO_STORAGE_BUCKET: str = "audio"
    MAX_TEXT_LENGTH: int = 5000
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
```

**`app/main.py`:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import Settings
from app.api.v1 import tts, voices

settings = Settings()
app = FastAPI(title="VoiceSensei API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tts.router, prefix="/api/v1")
app.include_router(voices.router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## 2. Init Next.js Frontend

**Thư mục:** `frontend/`

```bash
npx -y create-next-app@latest frontend/ \
  --typescript --tailwind --eslint \
  --app --src-dir --no-import-alias
```

**Cấu trúc chính:**

```
frontend/src/
├── app/
│   ├── layout.tsx           # Root layout + fonts
│   ├── page.tsx             # Landing / redirect to studio
│   └── studio/
│       └── page.tsx         # TTS Studio (main workspace)
├── components/
│   ├── TextInput.tsx        # Textarea với language selector
│   ├── AudioPlayer.tsx      # Play/Pause/Download + progress
│   └── VoiceSelector.tsx    # Dropdown chọn giọng
├── lib/
│   ├── api.ts               # Fetch wrapper cho backend
│   └── supabase.ts          # Supabase client init
└── types/
    └── tts.ts               # TypeScript types
```

**Dependencies bổ sung:**

```bash
npm install @supabase/supabase-js @supabase/ssr zustand
```

---

## 3. Supabase Setup

### Tables

```sql
-- Users mở rộng từ auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  api_key TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TTS Requests
CREATE TABLE public.tts_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('vi', 'en', 'ja')),
  voice_id TEXT NOT NULL,
  engine TEXT NOT NULL,
  speed FLOAT DEFAULT 1.0,
  pitch FLOAT DEFAULT 0,
  audio_path TEXT,
  audio_format TEXT DEFAULT 'mp3',
  duration_ms INTEGER,
  char_count INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Profiles
CREATE TABLE public.voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('vi', 'en', 'ja')),
  engine TEXT NOT NULL,
  engine_voice_id TEXT NOT NULL,
  sample_audio_path TEXT,
  is_cloned BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

```sql
-- Profiles: user chỉ xem/sửa profile mình
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- TTS Requests: user chỉ xem requests mình
ALTER TABLE public.tts_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own requests" ON public.tts_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own requests" ON public.tts_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Voice Profiles: public voices + own voices
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public voices" ON public.voice_profiles
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own voices" ON public.voice_profiles
  FOR SELECT USING (auth.uid() = user_id);
```

### Storage Bucket

```sql
-- Tạo bucket audio (trong Supabase Dashboard hoặc API)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true);
```

---

## 4. Edge TTS Engine

**`app/engines/base.py`:**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class TTSResult:
    audio_data: bytes
    duration_ms: int
    format: str
    word_timestamps: list[dict] | None = None

class TTSEngine(ABC):
    @abstractmethod
    async def synthesize(
        self,
        text: str,
        language: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 0,
        output_format: str = "mp3",
    ) -> TTSResult:
        ...

    @abstractmethod
    async def list_voices(self, language: str | None = None) -> list[dict]:
        ...
```

**`app/engines/edge_tts.py`:**

```python
import edge_tts
from app.engines.base import TTSEngine, TTSResult

# Default voices cho mỗi ngôn ngữ
DEFAULT_VOICES = {
    "vi": {"female": "vi-VN-HoaiMyNeural", "male": "vi-VN-NamMinhNeural"},
    "en": {"female": "en-US-JennyNeural", "male": "en-US-GuyNeural"},
    "ja": {"female": "ja-JP-NanamiNeural", "male": "ja-JP-KeitaNeural"},
}

class EdgeTTSEngine(TTSEngine):
    async def synthesize(self, text, language, voice_id, speed=1.0, pitch=0, output_format="mp3") -> TTSResult:
        # Map speed (0.5-2.0) → edge-tts rate format
        rate = f"{int((speed - 1) * 100):+d}%"
        pitch_str = f"{int(pitch):+d}Hz"

        communicate = edge_tts.Communicate(
            text=text, voice=voice_id, rate=rate, pitch=pitch_str
        )

        audio_chunks = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])

        audio_data = b"".join(audio_chunks)

        return TTSResult(
            audio_data=audio_data,
            duration_ms=0,  # calculate from audio later
            format="mp3",
        )

    async def list_voices(self, language=None):
        voices = await edge_tts.list_voices()
        if language:
            lang_prefix = {"vi": "vi-", "en": "en-", "ja": "ja-"}
            prefix = lang_prefix.get(language, "")
            voices = [v for v in voices if v["ShortName"].startswith(prefix)]
        return [
            {
                "id": v["ShortName"],
                "name": v["FriendlyName"],
                "language": v["Locale"],
                "gender": v["Gender"],
            }
            for v in voices
        ]
```

---

## 5. Core TTS API

**`app/api/v1/tts.py`:**

```python
from fastapi import APIRouter, HTTPException
from app.schemas.tts import TTSRequest, TTSResponse
from app.engines.router import EngineRouter
from supabase import create_client
from app.config import Settings
import uuid

router = APIRouter(tags=["TTS"])
settings = Settings()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
engine_router = EngineRouter()

@router.post("/tts", response_model=TTSResponse)
async def create_tts(request: TTSRequest):
    if len(request.text) > settings.MAX_TEXT_LENGTH:
        raise HTTPException(400, f"Text exceeds {settings.MAX_TEXT_LENGTH} chars")

    # Chọn engine
    engine = engine_router.select(
        user_tier="free",
        engine_pref=request.engine,
        language=request.language,
    )

    # Synthesize
    result = await engine.synthesize(
        text=request.text,
        language=request.language,
        voice_id=request.voice_id,
        speed=request.speed,
        pitch=request.pitch,
    )

    # Upload lên Supabase Storage
    file_id = str(uuid.uuid4())
    file_path = f"{request.language}/{file_id}.mp3"
    supabase.storage.from_(settings.AUDIO_STORAGE_BUCKET).upload(
        file_path, result.audio_data, {"content-type": "audio/mpeg"}
    )
    audio_url = supabase.storage.from_(settings.AUDIO_STORAGE_BUCKET).get_public_url(file_path)

    # Lưu vào DB
    record = supabase.table("tts_requests").insert({
        "id": file_id,
        "input_text": request.text,
        "language": request.language,
        "voice_id": request.voice_id,
        "engine": "edge_tts",
        "speed": request.speed,
        "pitch": request.pitch,
        "audio_path": file_path,
        "char_count": len(request.text),
        "status": "done",
    }).execute()

    return TTSResponse(
        id=file_id,
        status="done",
        audio_url=audio_url,
        char_count=len(request.text),
        engine_used="edge_tts",
    )
```

**`app/schemas/tts.py`:**

```python
from pydantic import BaseModel, Field

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    language: str = Field(..., pattern="^(vi|en|ja)$")
    voice_id: str = Field(default="vi-VN-HoaiMyNeural")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=0, ge=-10, le=10)
    format: str = Field(default="mp3")
    engine: str = Field(default="auto")

class TTSResponse(BaseModel):
    id: str
    status: str
    audio_url: str
    duration_ms: int | None = None
    char_count: int
    engine_used: str
    word_timestamps: list[dict] | None = None
```

---

## 6. Basic Frontend Studio

**`frontend/src/app/studio/page.tsx`** — Giao diện chính:

- **TextInput**: Textarea + dropdown chọn ngôn ngữ (VI/EN/JA)
- **VoiceSelector**: Dropdown chọn giọng (load từ `/api/v1/voices`)
- **Button "Chuyển đổi"**: Gọi `POST /api/v1/tts`
- **AudioPlayer**: Phát audio kết quả + nút Download

---

## 7. Docker Compose

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    env_file: .env
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

**`.env.example`:**

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# App
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Verification

| Test | Lệnh / Hành động | Kết quả mong đợi |
|------|-------------------|-------------------|
| Backend health | `curl http://localhost:8000/health` | `{"status": "ok"}` |
| List voices | `curl http://localhost:8000/api/v1/voices?language=vi` | JSON array giọng VI |
| TTS API | `curl -X POST .../api/v1/tts -d '{"text":"Xin chào","language":"vi"}'` | Trả audio_url |
| Audio playable | Mở audio_url trong browser | Nghe được "Xin chào" |
| Frontend UI | Mở `http://localhost:3000/studio` | Thấy TextInput + VoiceSelector |
| End-to-end | Nhập text trên UI → nhấn nút → nghe audio | Audio phát thành công |
