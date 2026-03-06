# Phase 1: Foundation — Các bước thực hiện 🏗️

> Tổng thời gian: 2 tuần | Status: ✅ Hoàn thành

---

## Bước 1: Tạo Backend FastAPI

```bash
mkdir -p backend/app/{api/v1,engines,schemas,services,utils}
touch backend/app/__init__.py backend/app/api/__init__.py backend/app/api/v1/__init__.py
touch backend/app/engines/__init__.py backend/app/schemas/__init__.py
touch backend/app/services/__init__.py backend/app/utils/__init__.py
```

**Files cần tạo:**

| File | Vai trò |
|------|---------|
| `backend/requirements.txt` | Dependencies: fastapi, uvicorn, edge-tts, supabase, pydantic-settings |
| `backend/app/main.py` | FastAPI app, CORS, mount routers, serve audio static files |
| `backend/app/config.py` | Pydantic Settings (SUPABASE_URL, CORS_ORIGINS, MAX_TEXT_LENGTH) |
| `backend/Dockerfile` | Python 3.12-slim, pip install, uvicorn CMD |

---

## Bước 2: TTS Engine Abstraction

**Files cần tạo:**

| File | Vai trò |
|------|---------|
| `backend/app/engines/base.py` | Abstract class `TTSEngine` + dataclass `TTSResult` |
| `backend/app/engines/edge_tts_engine.py` | Implementation Edge TTS (synthesize + list_voices + word timestamps) |
| `backend/app/engines/router.py` | `select_engine()` — chọn engine theo user tier, singleton pattern |

**Key patterns:**
- `TTSResult` chứa: `audio_data`, `duration_ms`, `format`, `word_timestamps`
- `synthesize()` nhận: text, language, voice_id, speed, pitch
- `list_voices()` filter theo language prefix (vi-, en-, ja-)

---

## Bước 3: API Routes + Schemas

**Files cần tạo:**

| File | Vai trò |
|------|---------|
| `backend/app/schemas/tts.py` | Pydantic models: `TTSRequest`, `TTSResponse`, `WordTimestamp` |
| `backend/app/api/v1/tts.py` | `POST /api/v1/tts` — synthesize, `GET /api/v1/tts/{id}` — get result |
| `backend/app/api/v1/voices.py` | `GET /api/v1/voices?language=vi` — list voices |

**Request flow:**
```
POST /tts → validate → select_engine → synthesize → upload audio → save record → response
```

---

## Bước 4: Services Layer

**Files cần tạo:**

| File | Vai trò |
|------|---------|
| `backend/app/services/storage.py` | `upload_audio()`, `get_audio_url()` — local files (→ Supabase Storage later) |
| `backend/app/services/db.py` | `save_tts_request()`, `get_tts_request()` — in-memory dict (→ Supabase later) |

---

## Bước 5: Cài đặt & Test Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Verify:**
```bash
curl http://localhost:8000/health
curl 'http://localhost:8000/api/v1/voices?language=vi'
curl -X POST http://localhost:8000/api/v1/tts \
  -H 'Content-Type: application/json' \
  -d '{"text":"Xin chào","language":"vi","voice_id":"vi-VN-HoaiMyNeural"}'
```

---

## Bước 6: Init Next.js Frontend

```bash
npx -y create-next-app@latest frontend/ \
  --typescript --tailwind --eslint --app --src-dir --turbopack
```

**Files cần tạo:**

| File | Vai trò |
|------|---------|
| `frontend/src/lib/api.ts` | API client: `synthesize()`, `listVoices()`, types |
| `frontend/src/app/layout.tsx` | Root layout, Inter font (Vietnamese subset), metadata SEO |
| `frontend/src/app/page.tsx` | Redirect → `/studio` |
| `frontend/src/app/globals.css` | Full dark-mode design system (CSS custom properties) |

---

## Bước 7: Frontend Components

| Component | File | Chức năng |
|-----------|------|-----------|
| **TextInput** | `src/components/TextInput.tsx` | Textarea + language tabs (VI/EN/JA) + char counter |
| **VoiceSelector** | `src/components/VoiceSelector.tsx` | Dropdown giọng, group theo gender, auto-load voices |
| **AudioPlayer** | `src/components/AudioPlayer.tsx` | Play/Pause, progress bar, word highlight, download |

---

## Bước 8: Studio Page

**File:** `frontend/src/app/studio/page.tsx`

Kết hợp tất cả components:
- TextInput (nhập text + chọn ngôn ngữ)
- VoiceSelector (chọn giọng)
- Speed slider (0.5x → 2.0x)
- Nút "Chuyển đổi" → gọi API → hiện AudioPlayer

---

## Bước 9: Docker Compose & Config

| File | Vai trò |
|------|---------|
| `docker-compose.yml` | Backend + Frontend + Redis, hot-reload volumes |
| `.env.example` | Template env vars (Supabase, API URL) |
| `README.md` | Quick start guide |

---

## Bước 10: Verify End-to-End

```bash
# Start backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Start frontend (terminal khác)
cd frontend && npm run dev
```

**Mở browser → http://localhost:3000/studio:**
- [ ] Header "VoiceSensei" hiện đúng
- [ ] 3 language tabs hoạt động
- [ ] Nhập text → chọn giọng → bấm "Chuyển đổi" → nghe audio
- [ ] Audio player có nút Play, progress bar, Download
- [ ] Thử cả 3 ngôn ngữ (VI/EN/JA)

---

> **Lưu ý Python 3.9:** Nếu máy dùng Python 3.9, cần dùng `Optional[str]` thay vì `str | None` và `List[Dict]` thay vì `list[dict]`.
