# Phase 4: Interactive Learning 🎯 (Tuần 8-9)

> Tính năng tương tác nâng cao cho dạy ngôn ngữ.

**Yêu cầu:** Phase 3 hoàn thành.
**Kết quả mong đợi:** Trải nghiệm tương tác: highlight từ, so sánh phát âm, batch convert.

---

## Checklist

- [ ] Word highlighting (karaoke-style)
- [ ] Word timestamps API
- [ ] Batch processing (file upload → bulk convert)
- [ ] Sentence comparison (user voice vs TTS)
- [ ] Audio waveform visualization

---

## 1. Word Highlighting (Karaoke-style)

### Cách hoạt động

```
"Xin chào, tôi là VoiceSensei"
 ^^^                              ← highlight khi audio đang phát "Xin"
      ^^^^^                       ← highlight khi phát "chào"
```

### Word Timestamps từ Engine

Edge TTS hỗ trợ trả về timing từng từ qua `WordBoundary` events:

```python
# Cập nhật edge_tts.py
async def synthesize(self, text, ...):
    communicate = edge_tts.Communicate(text=text, voice=voice_id)

    audio_chunks = []
    word_timestamps = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            word_timestamps.append({
                "word": chunk["text"],
                "start": chunk["offset"] / 10000,    # ticks → ms
                "end": (chunk["offset"] + chunk["duration"]) / 10000,
            })

    return TTSResult(
        audio_data=b"".join(audio_chunks),
        word_timestamps=word_timestamps,
        ...
    )
```

### Frontend Component

**`components/WordHighlight.tsx`:**

- Nhận `word_timestamps` từ API response
- Theo dõi `currentTime` của audio player
- Highlight từ đang phát bằng CSS class `.active-word`
- Hiệu ứng: background gradient sweep, smooth transition

```
Props:
  - words: { word: string, start: number, end: number }[]
  - currentTimeMs: number
  - onWordClick: (start: number) => void  // click từ → seek audio
```

**UX nâng cao:**
- Click vào từ → audio seek đến vị trí đó
- Hover từ → tooltip hiện IPA/phiên âm
- Scroll automatically khi audio dài

---

## 2. Batch Processing

### Flow

```
1. User upload file text (.txt, .srt, .csv)
2. System parse → tách thành danh sách câu
3. Mỗi câu → queue TTS task
4. Khi tất cả done → zip audio files → download
```

### API

```
POST /api/v1/tts/batch
  - Multipart: file (.txt/.srt/.csv)
  - Body: { "language": "vi", "voice_id": "...", "speed": 1.0 }
  - Response: { "batch_id": "uuid", "total_items": 25, "status": "processing" }

GET /api/v1/tts/batch/{batch_id}
  - Response: { "status": "done", "items": [...], "download_url": "/batch/uuid.zip" }
```

### Supported Formats

| Format | Parse logic |
|--------|------------|
| `.txt` | Split theo dòng hoặc dấu chấm câu |
| `.srt` | Parse subtitle → extract text lines |
| `.csv` | Cột `text` + optional `language`, `voice_id` |

### Supabase Table

```sql
CREATE TABLE public.batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  total_items INTEGER,
  completed_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Sentence Comparison (Speech Scoring)

### Flow

```
1. TTS phát mẫu: "Hello, how are you?"
2. User nhấn nút 🎤 Record → đọc theo
3. Upload recording → backend phân tích
4. Hiển thị: điểm phát âm, từ nào sai, gợi ý cải thiện
```

### Backend Analysis

```python
# Sử dụng Whisper để transcribe user audio → so sánh text
import whisper

model = whisper.load_model("base")

@router.post("/api/v1/pronunciation/compare")
async def compare_pronunciation(
    reference_text: str = Form(...),
    language: str = Form(...),
    user_audio: UploadFile = File(...),
):
    # 1. Transcribe user audio
    result = model.transcribe(user_audio_path, language=language)
    user_text = result["text"]

    # 2. So sánh từng từ
    ref_words = reference_text.lower().split()
    user_words = user_text.lower().split()

    comparison = []
    for i, ref_word in enumerate(ref_words):
        user_word = user_words[i] if i < len(user_words) else ""
        is_correct = ref_word == user_word
        comparison.append({
            "reference": ref_word,
            "spoken": user_word,
            "correct": is_correct,
        })

    score = sum(1 for c in comparison if c["correct"]) / len(comparison) * 100

    return {
        "score": round(score),
        "comparison": comparison,
        "feedback": generate_feedback(score, language),
    }
```

### Frontend Component

**`components/SpeechCompare.tsx`:**

- Nút 🎤 Record (Web Audio API / MediaRecorder)
- Hiển thị kết quả:
  - Điểm tổng: **85/100** ⭐⭐⭐⭐
  - Từng từ: xanh (đúng) / đỏ (sai)
  - Gợi ý: "Chú ý phát âm 'th' trong 'the'"

---

## 4. Audio Waveform Visualization

**Thư viện:** [WaveSurfer.js](https://wavesurfer.xyz/)

```bash
npm install wavesurfer.js
```

**`components/AudioPlayer.tsx` nâng cấp:**

- Waveform hiển thị toàn bộ audio
- Thanh progress chạy theo thời gian
- Click vào waveform → seek
- Zoom in/out waveform
- Hiện highlight vùng từ đang phát

---

## Verification

| Test | Hành động | Kết quả |
|------|-----------|---------|
| Word highlight | TTS → xem highlight | Từ sáng lên đúng nhịp audio |
| Word click | Click vào từ thứ 3 | Audio seek đến đúng vị trí |
| Batch upload .txt | Upload file 10 câu | 10 audio files, download zip |
| Batch upload .srt | Upload subtitle file | Parse đúng, TTS từng line |
| Speech compare | Đọc "Hello" → record → compare | Điểm + highlight xanh/đỏ |
| Waveform | Play audio | Waveform animate theo audio |
| Waveform seek | Click giữa waveform | Audio nhảy đến vị trí |
