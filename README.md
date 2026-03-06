# VoiceSensei — TTS Language Teaching Platform

🎙️ Text-to-Speech platform for language learning (Vietnamese, English, Japanese).

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

### 3. Docker (optional)

```bash
cp .env.example .env
docker-compose up
```

## API

- `POST /api/v1/tts` — Text to speech
- `GET /api/v1/voices?language=vi` — List voices
- `GET /health` — Health check

## Tech Stack

- **Backend:** Python FastAPI + Edge TTS
- **Frontend:** Next.js + TypeScript
- **Database:** Supabase (PostgreSQL)
- **Cache:** Redis
