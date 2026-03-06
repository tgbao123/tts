# Phase 2: Teaching Features — Các bước thực hiện 📚

> Tổng thời gian: 2 tuần | Status: ✅ Hoàn thành

---

## Bước 1: Cài thư viện Pronunciation

```bash
cd backend
source venv/bin/activate
pip install eng-to-ipa pykakasi
```

**Cập nhật** `backend/requirements.txt`:
```
eng-to-ipa
pykakasi
```

---

## Bước 2: Tạo Backend API Routes

| File | Vai trò |
|------|---------|
| `backend/app/api/v1/pronunciation.py` | POST `/api/v1/pronunciation` — trả IPA (EN), Romaji (JA), thanh điệu (VI) |
| `backend/app/api/v1/history.py` | GET `/api/v1/history`, DELETE `/api/v1/history/{id}`, POST/GET `/api/v1/favorites` |

**Pronunciation logic:**
- 🇻🇳 Vietnamese: Phân tích thanh điệu qua Unicode decomposition (ngang/huyền/sắc/hỏi/ngã/nặng)
- 🇬🇧 English: Thư viện `eng-to-ipa` chuyển → `/həˈloʊ/`
- 🇯🇵 Japanese: Thư viện `pykakasi` chuyển Kanji → Romaji

---

## Bước 3: Cập nhật DB Service

**File:** `backend/app/services/db.py`

Thêm các hàm:
- `get_all_tts_requests(language?)` — list history, sorted by created_at desc
- `delete_tts_request(id)` — xóa item
- `toggle_favorite(id)` — toggle favorite status
- `get_favorites()` — list favorites

---

## Bước 4: Cập nhật main.py

**File:** `backend/app/main.py`

```python
from app.api.v1 import pronunciation, history

app.include_router(pronunciation.router, prefix="/api/v1", tags=["Pronunciation"])
app.include_router(history.router, prefix="/api/v1", tags=["History"])
```

---

## Bước 5: Tạo Frontend Components

| Component | File | Chức năng |
|-----------|------|-----------|
| **SpeedControl** | `src/components/SpeedControl.tsx` | Slider 0.5x-2.0x + 3 presets (Chậm/Bình thường/Nhanh) |
| **PitchControl** | `src/components/PitchControl.tsx` | Slider -10 đến +10 Hz + Reset button |
| **PronunciationGuide** | `src/components/PronunciationGuide.tsx` | Fetch API + hiện IPA/Romaji/thanh điệu, debounce 500ms |
| **Navbar** | `src/components/Navbar.tsx` | Sticky nav: VoiceSensei brand + Studio/Lịch sử links |

---

## Bước 6: Cập nhật Studio Page

**File:** `frontend/src/app/studio/page.tsx`

- Import tất cả components mới
- Thêm state: `speed`, `pitch`
- Layout: 3-column grid cho Voice/Speed/Pitch controls
- PronunciationGuide bên dưới TextInput
- Navbar ở trên cùng

---

## Bước 7: Tạo History Page

**File:** `frontend/src/app/history/page.tsx`

- Fetch `/api/v1/history` từ backend
- Filter buttons: Tất cả / VI / EN / JA
- History cards: text truncated + language badge + meta (speed, chars)
- Actions: ▶️ Phát (inline player) / ☆ Thích (toggle fav) / 🗑️ Xóa

---

## Bước 8: Thêm CSS

**File:** `frontend/src/app/globals.css` — Thêm các section:

- `.navbar` — sticky dark navbar
- `.control-card` — card wrapper cho Speed/Pitch
- `.control-slider` — custom slider thumb
- `.control-preset` — preset buttons (Chậm/Nhanh)
- `.pronunciation` — guide container + green accent text
- `.history` — page layout
- `.history-card` — card items với hover effect
- `.history__filter` — pill filter buttons

---

## Bước 9: Verify

```bash
# Test Pronunciation API
curl -X POST http://localhost:8000/api/v1/pronunciation \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello","language":"en"}'
# → {"pronunciation":"hɛˈloʊ"}

curl -X POST http://localhost:8000/api/v1/pronunciation \
  -H 'Content-Type: application/json' \
  -d '{"text":"こんにちは","language":"ja"}'
# → {"pronunciation":"konnichiha"}

# Test History
curl http://localhost:8000/api/v1/history?limit=10
```

**Browser checks:**
- [ ] Navbar hiện đúng + active link highlight
- [ ] SpeedControl slider + 3 presets hoạt động
- [ ] PitchControl slider + Reset hoạt động
- [ ] IPA Phiên âm hiện khi nhập text EN
- [ ] Romaji hiện khi nhập text JA
- [ ] Thanh điệu hiện khi nhập text VI
- [ ] History page hiện danh sách TTS đã tạo
- [ ] Filter theo ngôn ngữ hoạt động
- [ ] Inline player ▶️ phát audio
- [ ] Toggle ⭐ Thích hoạt động
- [ ] 🗑️ Xóa item hoạt động
