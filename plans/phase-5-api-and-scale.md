# Phase 5: API & Scale 🚀 (Tuần 10-11)

> Public API, cloud tier, production deployment.

**Yêu cầu:** Phase 4 hoàn thành.
**Kết quả mong đợi:** Platform hoàn chỉnh: web app + public API + tiering.

---

## Checklist

- [ ] API key management
- [ ] Public API documentation
- [ ] Google Cloud TTS engine (Enterprise tier)
- [ ] Usage tracking & billing
- [ ] Landing page (marketing)
- [ ] Production deployment

---

## 1. API Key Management

### Supabase `profiles` table update

```sql
ALTER TABLE public.profiles
ADD COLUMN api_key_name TEXT,
ADD COLUMN api_key_last_used TIMESTAMPTZ;
```

### Endpoints

```
POST   /api/v1/api-keys          — Generate new API key
GET    /api/v1/api-keys          — List user's API keys
DELETE /api/v1/api-keys/{id}     — Revoke API key
```

### Backend Auth mở rộng

```python
# Hỗ trợ cả Supabase JWT và API Key
async def verify_auth(
    authorization: str = Header(None),
    x_api_key: str = Header(None),
):
    if x_api_key:
        # Verify API key từ profiles table
        result = supabase.table("profiles") \
            .select("*").eq("api_key", x_api_key).execute()
        if not result.data:
            raise HTTPException(401, "Invalid API key")
        return result.data[0]

    if authorization:
        # Verify Supabase JWT
        return await verify_token(authorization)

    raise HTTPException(401, "Authentication required")
```

### Usage example (cho developer)

```bash
# Sử dụng API key
curl -X POST https://api.voicesensei.com/api/v1/tts \
  -H "X-API-Key: vs_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}'
```

---

## 2. Public API Documentation

**Frontend:** `app/api-docs/page.tsx`

- Interactive docs giống Swagger UI nhưng custom design
- Sections:
  - **Getting Started** — Tạo account, lấy API key
  - **Authentication** — Header formats
  - **Endpoints** — Tất cả API có ví dụ
  - **SDKs** — Code examples (Python, JavaScript, curl)
  - **Rate Limits** — Bảng limits theo tier
  - **Errors** — Error codes + handling

**Cũng expose FastAPI auto-docs:**

```
GET /docs     — Swagger UI (auto-generated)
GET /redoc    — ReDoc (auto-generated)
```

---

## 3. Google Cloud TTS Engine (Enterprise)

**`app/engines/google_tts.py`:**

```python
from google.cloud import texttospeech
from app.engines.base import TTSEngine, TTSResult

class GoogleTTSEngine(TTSEngine):
    def __init__(self):
        self.client = texttospeech.TextToSpeechAsyncClient()

    async def synthesize(self, text, language, voice_id, speed=1.0, pitch=0, output_format="mp3"):
        lang_code_map = {"vi": "vi-VN", "en": "en-US", "ja": "ja-JP"}

        input_text = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=lang_code_map[language],
            name=voice_id,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speed,
            pitch=pitch,
        )

        response = await self.client.synthesize_speech(
            input=input_text, voice=voice, audio_config=audio_config
        )

        return TTSResult(
            audio_data=response.audio_content,
            duration_ms=0,
            format="mp3",
        )

    async def list_voices(self, language=None):
        lang_code_map = {"vi": "vi-VN", "en": "en-US", "ja": "ja-JP"}
        response = await self.client.list_voices(
            language_code=lang_code_map.get(language, "")
        )
        return [
            {
                "id": v.name,
                "name": v.name,
                "language": v.language_codes[0],
                "gender": v.ssml_gender.name,
            }
            for v in response.voices
        ]

    def supports_voice_cloning(self):
        return False
```

**Dependencies:**

```
google-cloud-texttospeech==2.*
```

---

## 4. Usage Tracking

### Supabase Table

```sql
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  date DATE DEFAULT CURRENT_DATE,
  char_count INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 0,
  engine TEXT,
  UNIQUE(user_id, date, engine)
);

-- Index cho query nhanh
CREATE INDEX idx_usage_user_date ON public.usage_logs(user_id, date);
```

### Tracking Middleware

```python
async def track_usage(user_id: str, char_count: int, engine: str):
    today = date.today().isoformat()
    supabase.rpc("increment_usage", {
        "p_user_id": user_id,
        "p_date": today,
        "p_chars": char_count,
        "p_engine": engine,
    }).execute()
```

### Dashboard cho user

**Frontend:** `app/settings/usage/page.tsx`

- Biểu đồ usage theo ngày/tuần/tháng
- Characters used / limit
- Requests count
- Engine breakdown (pie chart)

---

## 5. Landing Page

**Frontend:** `app/page.tsx` — Marketing page

**Sections:**

| Section | Nội dung |
|---------|----------|
| **Hero** | Headline + demo input → instant TTS |
| **Features** | 6 cards: Multi-language, Voice Clone, Speed Control, Word Highlight, Pronunciation, API |
| **Demo** | Interactive: nhập text → nghe ngay (không cần login) |
| **Pricing** | 3 tiers: Free / Pro / Enterprise |
| **API** | Code snippets + link docs |
| **Footer** | Links, social, legal |

---

## 6. Production Deployment

### Dockerfile (Backend — multi-stage)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Dockerfile (Frontend)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

### Production docker-compose

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    env_file: .env
    restart: always

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis-data:/data

  celery-worker:
    build: ./backend
    command: celery -A app.tasks worker --loglevel=info
    env_file: .env
    restart: always
    depends_on:
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend

volumes:
  redis-data:
```

---

## Verification

| Test | Hành động | Kết quả |
|------|-----------|---------|
| API key create | POST /api-keys | Nhận API key mới `vs_live_...` |
| API key auth | curl -H "X-API-Key: ..." | Request thành công |
| API key revoke | DELETE /api-keys/{id} → dùng lại key | 401 Unauthorized |
| API docs page | Mở /api-docs | Docs render đúng, interactive |
| Google TTS | TTS engine=google_tts (enterprise user) | Audio chất lượng cao |
| Usage tracking | TTS 5 requests → check /settings/usage | Biểu đồ hiện 5 requests |
| Landing page | Mở / | Hero + demo + pricing render |
| Landing demo | Nhập text trên landing → TTS | Audio phát không cần login |
| Production build | docker-compose up --build | Tất cả services chạy OK |
| Health check | curl /health | `{"status": "ok"}` |
