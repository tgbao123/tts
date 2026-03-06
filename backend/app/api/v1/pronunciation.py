from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class PronunciationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    language: str = Field(..., pattern="^(vi|en|ja)$")


class PronunciationResponse(BaseModel):
    original: str
    pronunciation: str
    language: str


def _get_vi_tones(text: str) -> str:
    """Phân tích thanh điệu tiếng Việt."""
    tone_map = {
        "\u0300": "huyền", "\u0301": "sắc", "\u0303": "ngã",
        "\u0309": "hỏi", "\u0323": "nặng",
    }
    import unicodedata
    words = text.split()
    result = []
    for word in words:
        decomposed = unicodedata.normalize("NFD", word)
        tone = "ngang"
        for char in decomposed:
            if char in tone_map:
                tone = tone_map[char]
                break
        result.append(f"{word} ({tone})")
    return " ".join(result)


def _get_en_ipa(text: str) -> str:
    """Chuyển text tiếng Anh sang IPA."""
    try:
        import eng_to_ipa as ipa
        return ipa.convert(text)
    except Exception:
        return text


def _get_ja_romaji(text: str) -> str:
    """Chuyển Kanji/Hiragana/Katakana sang Romaji."""
    try:
        from pykakasi import kakasi
        kks = kakasi()
        result = kks.convert(text)
        return " ".join([item["hepburn"] for item in result])
    except Exception:
        return text


@router.post("/pronunciation", response_model=PronunciationResponse)
async def get_pronunciation(request: PronunciationRequest):
    """Get pronunciation guide for text."""
    if request.language == "vi":
        pronunciation = _get_vi_tones(request.text)
    elif request.language == "en":
        pronunciation = _get_en_ipa(request.text)
    elif request.language == "ja":
        pronunciation = _get_ja_romaji(request.text)
    else:
        pronunciation = request.text

    return PronunciationResponse(
        original=request.text,
        pronunciation=pronunciation,
        language=request.language,
    )
