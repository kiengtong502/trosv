"""Gemini integration for area recommendation."""

from __future__ import annotations

import json
import logging
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from app.gemini.client import generate_with_fallback, get_client

logger = logging.getLogger("ai_service.gemini.areas")


class AreaItem(BaseModel):
    ward_id: int = Field(..., description="ward_id của khu vực")
    reason: str = Field(..., description="Lý do đề xuất ngắn gọn bằng tiếng Việt")


class AreasResponseSchema(BaseModel):
    results: list[AreaItem] = Field(..., description="Danh sách khu vực phù hợp nhất")


def recommend_areas_with_gemini(
    preferences: dict[str, Any], areas: list[dict[str, Any]], limit: int = 3
) -> dict[str, Any] | None:
    """Rank and recommend rental areas using Gemini."""
    client = get_client()
    if not client or not areas:
        return None

    budget_min = preferences.get("budget_min", 0)
    budget_max = preferences.get("budget_max", 0)
    priorities = preferences.get("priorities", [])

    prompt = (
        f"Đề xuất khu vực thuê trọ phù hợp nhất cho sinh viên:\n"
        f"- Ngân sách mong muốn: {budget_min:,} - {budget_max:,} VNĐ/tháng\n"
        f"- Các tiêu chí ưu tiên: {', '.join(priorities) or 'giá hợp lý'}\n\n"
        f"Dữ liệu các khu vực (phường/xã):\n"
    )
    for a in areas:
        dist = a.get("distance_to_school_km")
        rating = a.get("avg_rating")
        dist_str = f"{dist} km" if dist is not None else "chưa có khoảng cách"
        rating_str = f"{rating}/5" if rating is not None else "chưa có đánh giá"
        prompt += (
            f"- ward_id {a.get('ward_id')} ({a.get('name')}): Giá TB {a.get('avg_price', 0):,} VNĐ, "
            f"cách trường {dist_str}, điểm TB {rating_str}, {a.get('listings_count', 0)} tin đăng.\n"
        )

    prompt += (
        f"\nYêu cầu:\n"
        f"1. Chọn ra tối đa {max(1, limit)} khu vực tốt nhất phù hợp với ngân sách và ưu tiên.\n"
        f"2. Viết 'reason' ngắn gọn (1 câu tiếng Việt) nêu rõ tại sao khu vực này phù hợp.\n"
        f"3. Sắp xếp thứ tự từ tốt nhất đến thấp hơn.\n"
        f"4. 'ward_id' PHẢI thuộc danh sách các khu vực trên."
    )

    system_instruction = (
        "Bạn là chuyên gia tư vấn vị trí thuê trọ sinh viên tại TP.HCM. "
        "Cân nhắc hài hòa giữa khoảng cách tới trường và ngân sách hàng tháng. "
        "Luôn trả về JSON đúng cấu trúc."
    )

    try:
        raw_text = generate_with_fallback(
            client=client,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=AreasResponseSchema,
                temperature=0.2,
            ),
        )
        if not raw_text:
            return None
        res_dict = json.loads(raw_text)
        area_ids = {a["ward_id"] for a in areas}
        valid_results = [r for r in res_dict.get("results", []) if r.get("ward_id") in area_ids]
        if valid_results:
            return {"results": valid_results[:limit]}
    except Exception as exc:
        logger.warning(f"Gemini recommend_areas failed: {exc}")
    return None
