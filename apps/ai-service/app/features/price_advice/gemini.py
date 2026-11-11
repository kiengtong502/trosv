"""Gemini integration for rental price advice."""

from __future__ import annotations

import json
import logging
from typing import Any, cast

from google.genai import types
from pydantic import BaseModel, Field

from app.shared.gemini_client import generate_with_fallback, get_client

logger = logging.getLogger("ai_service.gemini.price_advice")


class PriceAdviceResponseSchema(BaseModel):
    verdict: str = Field(..., description="'high', 'fair', hoặc 'low'")
    fair_min: int = Field(..., description="Giá đề xuất tối thiểu hợp lý (VND)")
    fair_max: int = Field(..., description="Giá đề xuất tối đa hợp lý (VND)")
    tips: list[str] = Field(..., description="2 đến 3 lời khuyên thương lượng giá")
    message: str = Field(..., description="Tin nhắn mẫu lịch sự gửi chủ nhà")


def generate_price_advice_with_gemini(
    listing: dict[str, Any], stats: dict[str, Any]
) -> dict[str, Any] | None:
    """Evaluate rental price against area statistics using Gemini."""
    client = get_client()
    if not client:
        return None

    prompt = (
        f"Đánh giá mức giá thuê của tin đăng sau dựa trên thống kê thị trường cùng khu vực:\n"
        f"- Tin đăng: loại '{listing.get('type')}', diện tích {listing.get('area_m2')} m², "
        f"khu vực '{listing.get('ward')}', tiện ích: {', '.join(listing.get('amenities') or [])}\n"
        f"- Giá hiện tại của tin: {listing.get('price')} VNĐ/tháng\n"
        f"- Thống kê khu vực (từ {stats.get('count', 0)} tin tương tự):\n"
        f"  + Thấp nhất (min): {stats.get('min')} VNĐ\n"
        f"  + Trung vị (median): {stats.get('median')} VNĐ\n"
        f"  + Cao nhất (max): {stats.get('max')} VNĐ\n\n"
        "Yêu cầu:\n"
        "1. 'verdict': Chọn 'high' nếu giá cao hơn median trên 10%, 'low' nếu thấp hơn median trên 10%, ngược lại 'fair'.\n"
        "2. 'fair_min' và 'fair_max': Khoảng giá hợp lý (số nguyên VNĐ).\n"
        "3. 'tips': 2-3 gợi ý thiết thực khi sinh viên trao đổi hoặc thương lượng với chủ nhà.\n"
        "4. 'message': Đoạn tin nhắn mẫu lịch sự, tinh tế để sinh viên gửi chủ nhà qua khung chat."
    )

    system_instruction = (
        "Bạn là chuyên gia tư vấn giá thuê nhà trọ sinh viên tại TP.HCM. "
        "Đưa ra đánh giá khách quan, bảo vệ quyền lợi sinh viên và luôn giữ thái độ tôn trọng chủ nhà. "
        "Luôn trả về định dạng JSON đúng cấu trúc."
    )

    try:
        raw_text = generate_with_fallback(
            client=client,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=PriceAdviceResponseSchema,
                temperature=0.2,
            ),
        )
        if not raw_text:
            return None
        res_dict = json.loads(raw_text)
        if isinstance(res_dict, dict) and res_dict.get("verdict") in ("high", "fair", "low"):
            return cast("dict[str, Any]", res_dict)
    except Exception as exc:
        logger.warning(f"Gemini generate_price_advice failed: {exc}")
    return None
