"""Google Gemini client initialization and generation fallback."""

from __future__ import annotations

import logging
import os
from typing import Any

from google import genai
from google.genai import types

logger = logging.getLogger("ai_service.gemini.client")

DEFAULT_MODEL = "gemini-3.5-flash-lite"


def get_api_key() -> str | None:
    """Retrieve Gemini API key from environment."""
    return os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or None


def is_gemini_enabled() -> bool:
    """Return True if Gemini is configured and FAKE_MODE is not forced."""
    fake_mode = os.getenv("FAKE_MODE", "true").lower() == "true"
    api_key = get_api_key()
    return bool(api_key) and not fake_mode


def get_client() -> genai.Client | None:
    """Initialize Google GenAI client if API key is present."""
    api_key = get_api_key()
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as exc:
        logger.error(f"Failed to initialize Google GenAI client: {exc}")
        return None


def generate_with_fallback(
    client: genai.Client, contents: Any, config: types.GenerateContentConfig
) -> str | None:
    """Execute Gemini generation with model fallback on demand spikes or deprecation."""
    configured_model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
    candidate_models = [configured_model, "gemini-3.5-flash-lite", "gemini-3.5-flash"]
    seen: set[str] = set()
    models: list[str] = []
    for m in candidate_models:
        if m and m not in seen:
            seen.add(m)
            models.append(m)

    last_error: Exception | None = None
    for model_name in models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )
            if response and response.text:
                return response.text
        except Exception as exc:
            last_error = exc
            logger.warning(
                f"Gemini call with model '{model_name}' failed: {exc}. Trying next candidate..."
            )
    logger.warning(f"All Gemini models exhausted. Last error: {last_error}")
    return None
