from typing import Any

from fastapi import APIRouter

from app.features.chat.gemini import chat_with_gemini
from app.features.chat.heuristics import reply_chat
from app.features.chat.schemas import ChatReq
from app.shared.gemini_client import is_gemini_enabled
from app.shared.guard import guard_fake

router = APIRouter()


@router.post("/chat")
def chat(req: ChatReq) -> dict[str, Any]:
    """Tra loi FAKE_MODE theo tu khoa; ket thuc bang mui ten phap ly khi can."""
    if is_gemini_enabled():
        gemini_res = chat_with_gemini(req.message, req.history or [], req.listing)
        if gemini_res:
            return gemini_res

    guard_fake()
    return reply_chat(req)
