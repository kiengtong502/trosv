"""Gemini integration for listing description generation."""

from __future__ import annotations

import json
import logging
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from app.shared.gemini_client import generate_with_fallback, get_client

logger = logging.getLogger("ai_service.gemini.description")


class DescriptionResponseSchema(BaseModel):
    description: str = Field(
        ...,
        description="Mô tả tin đăng phòng trọ bằng tiếng Việt dài từ 80 đến 120 từ",
    )


def generate_description_with_gemini(data: dict[str, Any]) -> dict[str, str] | None:
    """Generate listing description using Gemini."""
    client = get_client()
    if not client:
        return None

    prompt = (
        f"Hãy viết mô tả phòng trọ cho tin đăng sau bằng tiếng Việt:\n"
        f"- Tiêu đề: {data.get('title', '')}\n"
        f"- Loại phòng: {data.get('type', 'phòng trọ')}\n"
        f"- Giá thuê: {data.get('price', 'thỏa thuận')} VNĐ/tháng\n"
        f"- Diện tích: {data.get('area_m2', 'không rõ')} m²\n"
        f"- Địa chỉ: {data.get('address') or 'chưa cung cấp'}\n"
        f"- Phường/xã: {data.get('ward') or 'chưa cung cấp'}\n"
        f"- Tiện ích: {', '.join(data.get('amenities') or []) or 'chưa cung cấp'}\n\n"
        "Yêu cầu:\n"
        "1. Độ dài từ 80 đến 120 từ, giọng điệu thân thiện, rõ ràng, lịch sự.\n"
        "2. CHỈ sử dụng các thông tin đã được cung cấp ở trên.\n"
        "3. TUYỆT ĐỐI KHÔNG tự bịa đặt khoảng cách tới trường học, giá cả, hoặc tiện ích không có.\n"
        "4. Kêu gọi người thuê liên hệ trực tiếp qua tin nhắn để xem phòng."
    )

    system_instruction = (
        "Bạn là trợ lý viết tin đăng phòng trọ sinh viên chuyên nghiệp tại Việt Nam. "
        "Luôn trả lời dưới dạng JSON tuân thủ schema được chỉ định."
    )

    try:
        raw_text = generate_with_fallback(
            client=client,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=DescriptionResponseSchema,
                temperature=0.3,
            ),
        )
        if not raw_text:
            return None
        res_dict = json.loads(raw_text)
        if "description" in res_dict and isinstance(res_dict["description"], str):
            return {"description": res_dict["description"].strip()}
    except Exception as exc:
        logger.warning(f"Gemini generate_description failed: {exc}")
    return None
