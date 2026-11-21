"""Gemini integration for area recommendation."""

from __future__ import annotations

import json
import logging
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from app.features.areas.heuristics import PRIORITY_LABELS
from app.shared.gemini_client import generate_with_fallback, get_client
from app.shared.parsing import int_or
from app.shared.text import vnd

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

    budget_min = int_or(preferences.get("budget_min"), 0)
    budget_max = int_or(preferences.get("budget_max"), 0)
    # The backend sends PHP_INT_MAX when the student gave no upper bound.
    budget_max_str = vnd(budget_max) if 0 < budget_max < 10**10 else "không giới hạn"
    priorities = [PRIORITY_LABELS.get(p, p) for p in preferences.get("priorities") or []]
    school = preferences.get("school")
    city = preferences.get("city")

    prompt = (
        f"Đề xuất khu vực thuê trọ phù hợp nhất cho sinh viên:\n"
        f"- Trường: {school or 'chưa chọn'}{f' ({city})' if city else ''}\n"
        f"- Ngân sách: {vnd(budget_min)} - {budget_max_str}/tháng\n"
        f"- Ưu tiên của sinh viên: {', '.join(priorities) or 'giá hợp lý'}\n\n"
        f"Dữ liệu các khu vực (chỉ tính phòng còn trống trong ngân sách):\n"
    )
    for a in areas:
        dist = a.get("distance_to_school_km")
        rating = a.get("avg_rating")
        dist_str = f"{dist} km" if dist is not None else "chưa có khoảng cách"
        rating_str = f"{rating}/5" if rating is not None else "chưa có đánh giá"
        prompt += (
            f"- ward_id {a.get('ward_id')} ({a.get('name')}): giá TB {vnd(int_or(a.get('avg_price'), 0))}, "
            f"cách trường {dist_str}, điểm TB {rating_str}, {a.get('listings_count', 0)} phòng.\n"
        )

    prompt += (
        f"\nYêu cầu:\n"
        f"1. Chọn tối đa {max(1, limit)} khu vực, xếp từ phù hợp nhất. Ưu tiên của sinh viên quyết định thứ tự.\n"
        f"2. 'reason': 1 câu tiếng Việt có dấu, xưng 'bạn', nêu con số cụ thể từ dữ liệu "
        f"(giá, khoảng cách, điểm) liên quan tới ưu tiên. Nếu có điểm yếu đáng kể thì nói ngắn gọn.\n"
        f"3. Chỉ dùng dữ liệu ở trên, không bịa thêm tiện ích, tuyến xe hay đặc điểm khu vực.\n"
        f"4. 'ward_id' PHẢI thuộc danh sách các khu vực trên."
    )

    system_instruction = (
        "Bạn là chuyên gia tư vấn vị trí thuê trọ cho sinh viên Việt Nam. "
        "Cân nhắc hài hòa giữa khoảng cách tới trường, ngân sách, đánh giá và số lựa chọn. "
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
