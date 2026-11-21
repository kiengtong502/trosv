"""Gemini integration for rental price advice."""

from __future__ import annotations

import json
import logging
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from app.features.price_advice.heuristics import advise_price
from app.features.price_advice.schemas import PriceAdviceReq
from app.shared.gemini_client import generate_with_fallback, get_client
from app.shared.parsing import int_or
from app.shared.text import vnd

logger = logging.getLogger("ai_service.gemini.price_advice")


class PriceAdviceResponseSchema(BaseModel):
    tips: list[str] = Field(..., description="2 đến 3 lời khuyên thương lượng giá")
    message: str = Field(..., description="Tin nhắn mẫu lịch sự gửi chủ nhà")


_VERDICT_LABELS = {
    "high": "cao hơn mặt bằng khu vực",
    "fair": "hợp lý so với khu vực",
    "low": "thấp hơn mặt bằng khu vực",
}


def generate_price_advice_with_gemini(
    listing: dict[str, Any], stats: dict[str, Any]
) -> dict[str, Any] | None:
    """Verdict and fair range come from the ±10% rule; Gemini only writes tips and message."""
    client = get_client()
    if not client or int_or(stats.get("median"), 0) <= 0:
        return None
    facts = advise_price(PriceAdviceReq(listing=listing, stats=stats))

    prompt = (
        f"Tin đăng: loại '{listing.get('type')}', diện tích {listing.get('area_m2')} m², "
        f"khu vực '{listing.get('ward')}', tiện ích: {', '.join(listing.get('amenities') or []) or 'không ghi'}\n"
        f"- Giá của tin: {vnd(int_or(listing.get('price'), 0))}/tháng\n"
        f"- Thống kê {stats.get('count', 0)} tin tương tự: thấp nhất {vnd(int_or(stats.get('min'), 0))}, "
        f"trung vị {vnd(int_or(stats.get('median'), 0))}, cao nhất {vnd(int_or(stats.get('max'), 0))}\n"
        f"- Kết luận đã tính sẵn (KHÔNG thay đổi): giá {_VERDICT_LABELS[facts['verdict']]}; "
        f"khoảng hợp lý {vnd(facts['fair_min'])} - {vnd(facts['fair_max'])}\n\n"
        "Yêu cầu:\n"
        "1. 'tips': 2-3 gợi ý ngắn, thiết thực cho sinh viên, phù hợp với kết luận trên "
        "(giá hợp lý hoặc thấp thì tập trung kiểm tra chi phí phát sinh, không ép giá).\n"
        "2. 'message': tin nhắn mẫu lịch sự sinh viên gửi chủ nhà, nêu con số cụ thể, "
        "xưng 'em' và gọi 'anh/chị'.\n"
        "3. Chỉ dùng dữ liệu ở trên, không bịa thêm."
    )

    system_instruction = (
        "Bạn là chuyên gia tư vấn giá thuê trọ cho sinh viên Việt Nam. Bảo vệ quyền lợi sinh viên "
        "nhưng luôn tôn trọng chủ nhà. Luôn trả về JSON đúng cấu trúc."
    )

    try:
        raw_text = generate_with_fallback(
            client=client,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=PriceAdviceResponseSchema,
                temperature=0.3,
            ),
        )
        if not raw_text:
            return None
        res = json.loads(raw_text)
        tips, message = res.get("tips"), res.get("message")
        if (
            isinstance(tips, list)
            and tips
            and all(isinstance(t, str) for t in tips)
            and isinstance(message, str)
            and message.strip()
        ):
            return {**facts, "tips": [t.strip() for t in tips][:3], "message": message.strip()}
    except Exception as exc:
        logger.warning(f"Gemini generate_price_advice failed: {exc}")
    return None
