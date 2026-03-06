# Phase 2: Language Teaching Features 📚 (Tuần 3-4)

> Thêm tính năng dành riêng cho dạy ngôn ngữ.

**Yêu cầu:** Phase 1 hoàn thành.
**Kết quả mong đợi:** Trải nghiệm hoàn chỉnh cho học sinh: nghe chậm, xem phiên âm, lưu lại.

---

## Checklist

- [ ] Speed control (0.5x - 2.0x)
- [ ] Pitch control
- [ ] Multi-voice UI (Voice Gallery)
- [ ] User auth (Supabase Auth)
- [ ] History page
- [ ] Favorites
- [ ] Pronunciation guide (IPA / Romaji)
- [ ] Audio download button

---

## 1. Speed & Pitch Control

**Frontend:** `SpeedControl.tsx`

- Slider từ **0.5x** (rất chậm — cho người mới) → **1.0x** (bình thường) → **2.0x** (nhanh)
- Hiển thị giá trị hiện tại (vd: "0.7x — Chậm")
- Presets nhanh: `Chậm (0.5x)` · `Bình thường (1.0x)` · `Nhanh (1.5x)`

**Frontend:** `PitchControl.tsx`

- Slider từ **-10** đến **+10** Hz
- Label: "Giọng trầm" ↔ "Giọng cao"

**Backend:** Đã hỗ trợ sẵn trong Edge TTS — chỉ cần map `speed` và `pitch` từ request.

---

## 2. Multi-voice UI

**Frontend:** `VoiceSelector.tsx` cải tiến

- Load danh sách giọng từ `GET /api/v1/voices?language={lang}`
- Group theo: **Ngôn ngữ** → **Giới tính** (Nam/Nữ)
- Mỗi voice card có:
  - Tên giọng
  - Nút ▶️ preview (phát mẫu ngắn "Xin chào" / "Hello" / "こんにちは")
  - Badge ngôn ngữ (🇻🇳 🇬🇧 🇯🇵)

**Voices mặc định:**

| Ngôn ngữ | Nữ | Nam |
|-----------|-----|------|
| 🇻🇳 Tiếng Việt | vi-VN-HoaiMyNeural | vi-VN-NamMinhNeural |
| 🇬🇧 Tiếng Anh | en-US-JennyNeural | en-US-GuyNeural |
| 🇯🇵 Tiếng Nhật | ja-JP-NanamiNeural | ja-JP-KeitaNeural |

---

## 3. User Auth (Supabase Auth)

### Frontend Integration

```typescript
// lib/supabase.ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Auth flows cần implement:**

| Flow | UI | Supabase method |
|------|----|-----------------|
| Đăng ký email | Form email + password | `supabase.auth.signUp()` |
| Đăng nhập email | Form email + password | `supabase.auth.signInWithPassword()` |
| Google OAuth | Nút "Sign in with Google" | `supabase.auth.signInWithOAuth()` |
| Đăng xuất | Nút Logout trên navbar | `supabase.auth.signOut()` |

**Pages mới:**

- `app/login/page.tsx` — Form đăng nhập
- `app/register/page.tsx` — Form đăng ký

**Middleware:** Bảo vệ route `/studio`, `/history` — redirect nếu chưa login.

### Backend Verification

```python
# app/utils/auth.py
from supabase import create_client
from fastapi import Header, HTTPException

async def verify_token(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(401, "Invalid token")
    return user
```

---

## 4. History Page

**Frontend:** `app/history/page.tsx`

- Danh sách TTS requests của user (paginated, load từ Supabase)
- Mỗi item hiển thị:
  - Text đã chuyển đổi (truncated)
  - Ngôn ngữ + giọng
  - Thời gian tạo
  - Nút ▶️ Replay
  - Nút ⭐ Favorite
  - Nút 🗑️ Delete
- Search/filter theo ngôn ngữ

**Backend endpoints:**

```
GET  /api/v1/history?page=1&limit=20&language=vi
DELETE /api/v1/history/{id}
```

---

## 5. Favorites

**Supabase table bổ sung:**

```sql
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tts_request_id UUID REFERENCES public.tts_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tts_request_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);
```

**Endpoints:**

```
POST   /api/v1/favorites/{tts_id}     — Toggle favorite
GET    /api/v1/favorites?page=1        — List favorites
```

---

## 6. Pronunciation Guide

**Frontend:** `PronunciationGuide.tsx`

Hiển thị phiên âm bên dưới text gốc:

| Ngôn ngữ | Loại phiên âm | Ví dụ |
|-----------|---------------|-------|
| 🇻🇳 Tiếng Việt | Thanh điệu markers | `xin (ngang) chào (huyền)` |
| 🇬🇧 Tiếng Anh | IPA | `/həˈloʊ/` |
| 🇯🇵 Tiếng Nhật | Romaji + Furigana | `こんにちは → kon'nichiwa` |

**Thư viện gợi ý:**

- Tiếng Anh IPA: `eng-to-ipa` (Python)
- Tiếng Nhật Romaji: `pykakasi` (Python)
- Tiếng Việt: Custom mapping (thanh điệu đã có trong Unicode)

**API mới:**

```
POST /api/v1/pronunciation
Body: { "text": "Hello", "language": "en" }
Response: { "ipa": "/həˈloʊ/", "syllables": ["hə", "ˈloʊ"] }
```

---

## 7. Audio Download

**Frontend:** Nút Download trên AudioPlayer

- Download dạng MP3 (default) hoặc WAV
- Filename format: `voicesensei_{language}_{timestamp}.mp3`
- Sử dụng Supabase Storage signed URL hoặc public URL

---

## Verification

| Test | Hành động | Kết quả |
|------|-----------|---------|
| Speed slow | Chọn 0.5x → TTS → nghe | Audio rõ ràng chậm hơn |
| Speed fast | Chọn 1.5x → TTS → nghe | Audio nhanh hơn |
| Pitch | Chọn pitch +5 → TTS | Giọng cao hơn |
| Voice switch | Chọn giọng nam → TTS → chọn nữ → TTS | 2 audio khác giọng |
| Auth signup | Đăng ký email → verify | Vào được /studio |
| Auth login | Đăng nhập → redirect /studio | Session active |
| Auth protect | Truy cập /history khi chưa login | Redirect /login |
| History list | Tạo 3 TTS → vào /history | Thấy 3 items |
| History delete | Nhấn 🗑️ trên 1 item | Item biến mất |
| Favorite toggle | Nhấn ⭐ → nhấn lại | Toggle on/off |
| Pronunciation EN | Nhập "Hello" EN → xem IPA | Hiện `/həˈloʊ/` |
| Download | Nhấn Download → mở file | File MP3 phát được |
