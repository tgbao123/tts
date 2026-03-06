from typing import Dict, Optional

from app.engines.base import TTSEngine
from app.engines.edge_tts_engine import EdgeTTSEngine

_engines: Dict[str, TTSEngine] = {}


def get_engine(engine_name: str = "edge_tts") -> TTSEngine:
    """Return a singleton engine instance by name."""
    if engine_name not in _engines:
        if engine_name == "edge_tts":
            _engines[engine_name] = EdgeTTSEngine()
        else:
            _engines["edge_tts"] = EdgeTTSEngine()
            return _engines["edge_tts"]
    return _engines[engine_name]


def select_engine(user_tier: str = "free", engine_pref: str = "auto") -> TTSEngine:
    """Select engine based on user tier and preference."""
    if engine_pref != "auto":
        return get_engine(engine_pref)

    # Phase 1: all tiers use edge_tts
    # Phase 3: pro → fish_speech
    # Phase 5: enterprise → google_tts
    return get_engine("edge_tts")
