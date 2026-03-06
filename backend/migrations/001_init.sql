-- VoiceSensei Migration: Create all tables
-- Run this in Supabase SQL Editor

-- 1. TTS Requests (history)
CREATE TABLE IF NOT EXISTS public.tts_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text TEXT NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'vi',
  voice_id VARCHAR(100) NOT NULL,
  engine VARCHAR(50) NOT NULL DEFAULT 'edge_tts',
  speed FLOAT NOT NULL DEFAULT 1.0,
  pitch FLOAT NOT NULL DEFAULT 0,
  audio_path TEXT,
  char_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'done',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tts_requests_language ON public.tts_requests(language);
CREATE INDEX IF NOT EXISTS idx_tts_requests_created ON public.tts_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tts_requests_favorite ON public.tts_requests(is_favorite) WHERE is_favorite = true;

-- 2. Voice Profiles (cloned voices)
CREATE TABLE IF NOT EXISTS public.voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'vi',
  gender VARCHAR(20) DEFAULT 'Unknown',
  engine VARCHAR(50) NOT NULL DEFAULT 'fish_speech',
  engine_voice_id VARCHAR(200),
  is_cloned BOOLEAN NOT NULL DEFAULT true,
  badge VARCHAR(20) DEFAULT 'Cloned',
  status VARCHAR(20) DEFAULT 'ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL DEFAULT 'Default',
  key VARCHAR(200) NOT NULL UNIQUE,
  key_preview VARCHAR(20) NOT NULL,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(key);

-- 4. Usage Logs
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  engine VARCHAR(50) NOT NULL DEFAULT 'edge_tts',
  char_count INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, engine)
);

CREATE INDEX IF NOT EXISTS idx_usage_date ON public.usage_logs(date DESC);

-- 5. Enable RLS (Row Level Security) - disabled for now (no auth yet)
ALTER TABLE public.tts_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (no auth)
CREATE POLICY "Allow all on tts_requests" ON public.tts_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on voice_profiles" ON public.voice_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on api_keys" ON public.api_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on usage_logs" ON public.usage_logs FOR ALL USING (true) WITH CHECK (true);
