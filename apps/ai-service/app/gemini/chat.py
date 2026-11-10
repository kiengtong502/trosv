"""Gemini integration for rental consultation chat with RAG-lite knowledge base."""

from __future__ import annotations

import json
import logging
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from app.gemini.client import generate_with_fallback, get_client, load_knowledge_base

logger = logging.getLogger("ai_service.gemini.chat")

KNOWLEDGE_BASE = load_knowledge_base()


class ChatResponseSchema(BaseModel):
    reply: str = Field(..., description="Câu trả lời tư vấn cho sinh viên")


def _build_context_sections(listing: dict[str, Any] | None) -> list[str]:
    sections: list[str] = []
    if KNOWLEDGE_BASE:
        sections.append(f"=== KIẾN THỨC NỀN TẢNG THUÊ TRỌ ===\n{KNOWLEDGE_BASE}")
    if listing:
        sections.append(
            f"=== THÔNG TIN PHÒNG TRỌ ĐANG XEM ===\n"
            f"- Tiêu đề: {listing.get('title')}\n"
            f"- Giá: {listing.get('price')} VNĐ/tháng\n"
            f"- Diện tích: {listing.get('area_m2')} m²\n"
            f"- Địa chỉ: {listing.get('address')}, {listing.get('ward')}\n"
            f"- Tiện ích: {', '.join(listing.get('amenities') or [])}\n"
            f"- Mô tả: {listing.get('description', '')}"
        )
    return sections


def chat_with_gemini(
    message: str,
    history: list[dict[str, Any]],
    listing: dict[str, Any] | None = None,
) -> dict[str, str] | None:
    """Answer rental questions using Gemini with domain knowledge injection."""
    client = get_client()
    if not client:
        return None

    legal_tail = " Thông tin mang tính tham khảo, không thay thế tư vấn pháp lý."
    system_instruction = (
        "Bạn là trợ lý ảo thân thiện, đáng tin cậy của nền tảng tìm phòng trọ sinh viên TROSV.\n"
        "Nhiệm vụ của bạn là giải đáp thắc mắc về tìm phòng, giá thuê, tiền cọc, an toàn và hợp đồng thuê trọ.\n\n"
        "QUY TẮC BẮT BUỘC:\n"
        "1. Luêu trả lời bằng tiếng Việt lịch sự, dễ hiểu, ấm áp.\n"
        "2. Sử dụng thông tin trong KIẾN THỨC NỀN TẢNG THUÊ TRỌ để trả lời.\n"
        f"3. Nếu câu hỏi liên quan đến hợp đồng, tiền cọc, hoặc pháp lý, BẮT BUỘC kết thúc câu trả lời bằng câu: '{legal_tail.strip()}'\n"
        "4. Nếu không có thông tin hoặc không chắc chắn, hãy thành thật nói không biết, không tự bịa đặt.\n"
        "5. Tuyệt đối không bịa đặt thêm thông tin sai lệch về phòng trọ đang xem.\n"
        "6. Luôn trả về định dạng JSON theo schema đã cho."
    )

    contents: list[types.Content] = []
    context_sections = _build_context_sections(listing)
    if context_sections:
        contents.append(
            types.Content(
                role="user", parts=[types.Part.from_text(text="\n\n".join(context_sections))]
            )
        )
        contents.append(
            types.Content(
                role="model",
                parts=[
                    types.Part.from_text(
                        text="Tôi đã nắm rõ kiến thức nền tảng và thông tin phòng trọ. Tôi sẵn sàng hỗ trợ sinh viên."
                    )
                ],
            )
        )

    for turn in history[-10:]:
        role = "user" if turn.get("role") == "user" else "model"
        content_text = str(turn.get("content", ""))
        if content_text.strip():
            contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=content_text)])
            )

    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

    try:
        raw_text = generate_with_fallback(
            client=client,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ChatResponseSchema,
                temperature=0.3,
            ),
        )
        if not raw_text:
            return None
        res_dict = json.loads(raw_text)
        reply = res_dict.get("reply", "").strip()
        if reply:
            return {"reply": reply}
    except Exception as exc:
        logger.warning(f"Gemini chat failed: {exc}")
    return None
