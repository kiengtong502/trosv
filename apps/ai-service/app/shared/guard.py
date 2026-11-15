from fastapi import HTTPException

from app.shared.gemini_client import get_api_key, is_fake_mode


def guard_fake() -> None:
    """Non-2xx neu FAKE_MODE tat va khong co API key - backend doi thanh 503 theo contract."""
    if not is_fake_mode() and not get_api_key():
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY hoac LLM_API_KEY chua duoc cau hinh",
        )
