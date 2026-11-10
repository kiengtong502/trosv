"""Google Gemini client integration package for TROSV AI Service."""

from __future__ import annotations

from app.gemini.areas import recommend_areas_with_gemini
from app.gemini.chat import chat_with_gemini
from app.gemini.client import get_api_key, is_gemini_enabled
from app.gemini.description import generate_description_with_gemini
from app.gemini.price_advice import generate_price_advice_with_gemini
from app.gemini.roommates import rank_roommates_with_gemini

__all__ = [
    "chat_with_gemini",
    "generate_description_with_gemini",
    "generate_price_advice_with_gemini",
    "get_api_key",
    "is_gemini_enabled",
    "rank_roommates_with_gemini",
    "recommend_areas_with_gemini",
]
