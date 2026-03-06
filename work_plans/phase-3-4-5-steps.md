# Phase 3: Advanced TTS — Các bước thực hiện 🔊

> Status: ✅ Hoàn thành

## Bước 1: Tạo Fish Speech Engine
**File:** `backend/app/engines/fish_speech.py`
- TTSEngine interface kết nối GPU server via HTTP
- `synthesize()` → POST /v1/tts
- `create_reference()` → Upload audio → tạo voice reference
- `check_available()` → kiểm tra server sẵn sàng

## Bước 2: Tạo Google Cloud TTS Engine
**File:** `backend/app/engines/google_tts.py`
- Enterprise tier, cần `google-cloud-texttospeech`
- Supports speed + pitch parameters

## Bước 3: Voice Gallery API
**File:** `backend/app/api/v1/voice_gallery.py`
- `GET /voices/gallery?tab=default&language=vi`
- `POST /voices/clone` — upload audio → clone voice
- 6 preset Neural voices (VI/EN/JA × Male/Female)

## Bước 4: Cache + Rate Limiting
**File:** `backend/app/services/cache.py`
- CacheService: MD5 hash key → audio URL
- RateLimiter: 50/day (free), unlimited (pro/enterprise)

## Bước 5: Voice Gallery Frontend
**File:** `frontend/src/app/voices/page.tsx`
- Grid layout voice cards
- Tabs: Mặc định / Cloned
- Language filters + Preview + Sử dụng buttons

---

# Phase 4: Interactive Learning — Các bước thực hiện 📦

> Status: ✅ Hoàn thành

## Bước 1: Batch Processing API
**File:** `backend/app/api/v1/batch.py`
- `POST /tts/batch` — upload .txt/.srt → parse → convert all → ZIP
- `GET /tts/batch/{id}` — get status
- Parse TXT (by line) và SRT (skip timecodes)

## Bước 2: Batch Frontend
**File:** `frontend/src/app/batch/page.tsx`
- File upload + language select
- Results: item list with ✅/❌ status
- Download ZIP button

---

# Phase 5: API & Scale — Các bước thực hiện 🚀

> Status: ✅ Hoàn thành

## Bước 1: API Key Management
**File:** `backend/app/api/v1/api_keys.py`
- `POST /api-keys` → generate `vs_live_xxxxx`
- `GET /api-keys` → list (masked keys)
- `DELETE /api-keys/{id}` → revoke

## Bước 2: Usage Tracking
- `track_usage(user_id, chars, engine)` per day
- `GET /usage?days=7` → total chars/requests

## Bước 3: API Docs Frontend
**File:** `frontend/src/app/api-docs/page.tsx`
- Getting Started + Base URL
- Authentication (X-API-Key header)
- Endpoints with curl examples
- Rate Limits table (Free/Pro/Enterprise)
- SDK examples (Python + JavaScript)

## Bước 4: Landing Page
**File:** `frontend/src/app/page.tsx`
- Hero: "Biến Text thành Giọng nói" + CTA buttons
- Features: 6 cards grid
- Pricing: 3-tier cards ($0 / $9 / $29)
- Footer

## Bước 5: Update Navbar + main.py
- Navbar: 5 links (Studio / Voices / Batch / Lịch sử / API)
- main.py: All routers wired v2.0.0
