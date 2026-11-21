"""Google Gemini client initialization and generation fallback."""

from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types

logger = logging.getLogger("ai_service.gemini.client")

DEFAULT_MODEL = "gemini-3.5-flash-lite"
# Gemini rejects per-call deadlines under 10 s (400 INVALID_ARGUMENT).
CALL_TIMEOUT_MS = 10_000
# The backend waits 15 s in total; a fallback call starting later than this could outlive it.
FALLBACK_CUTOFF_S = 15 - CALL_TIMEOUT_MS / 1000 - 2


def get_api_key() -> str | None:
    """Retrieve Gemini API key from environment."""
    return os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or None


def is_fake_mode() -> bool:
    """Only an explicit FAKE_MODE=false turns fake mode off (anything else stays free)."""
    return os.getenv("FAKE_MODE", "true").strip().lower() != "false"


def is_gemini_enabled() -> bool:
    """Return True if Gemini is configured and FAKE_MODE is not forced."""
    return bool(get_api_key()) and not is_fake_mode()


def get_client() -> genai.Client | None:
    """Initialize Google GenAI client if API key is present."""
    api_key = get_api_key()
    if not api_key:
        return None
    try:
        return genai.Client(
            api_key=api_key, http_options=types.HttpOptions(timeout=CALL_TIMEOUT_MS)
        )
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
    started = time.monotonic()
    for i, model_name in enumerate(models):
        if i and time.monotonic() - started > FALLBACK_CUTOFF_S:
            break  # only fast failures (overload, unknown model) get a retry
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


def load_knowledge_base() -> str:
    """Load grounding knowledge base markdown file across relative candidate paths."""
    candidates = [
        Path(__file__).parent / "knowledge.md",
        Path(__file__).parent.parent / "knowledge.md",
        Path(__file__).parent.parent.parent / "knowledge.md",
    ]
    for p in candidates:
        if p.exists():
            try:
                return p.read_text(encoding="utf-8")
            except Exception as exc:
                logger.warning(f"Failed to read knowledge file {p}: {exc}")
    return ""
