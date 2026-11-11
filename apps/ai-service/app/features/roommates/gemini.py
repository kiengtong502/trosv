"""Gemini integration for roommate matching and ranking."""

from __future__ import annotations

import json
import logging
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from app.shared.gemini_client import generate_with_fallback, get_client

logger = logging.getLogger("ai_service.gemini.roommates")


class RoommateItem(BaseModel):
    id: int = Field(..., description="ID của ứng viên")
    score: int = Field(..., description="Điểm tương thích từ 0 đến 100")
    reason: str = Field(..., description="Lý do tương thích ngắn gọn bằng tiếng Việt")


class RoommatesResponseSchema(BaseModel):
    results: list[RoommateItem] = Field(..., description="Danh sách xếp hạng bạn cùng phòng")


def rank_roommates_with_gemini(
    requester: dict[str, Any], candidates: list[dict[str, Any]], limit: int = 5
) -> dict[str, Any] | None:
    """Rank roommate candidates and generate personalized reasoning using Gemini."""
    client = get_client()
    if not client or not candidates:
        return None

    prompt = (
        f"Hãy phân tích độ tương thích và xếp hạng bạn cùng phòng cho sinh viên sau:\n"
        f"Người tìm: Ngân sách {requester.get('budget_min')}-{requester.get('budget_max')} VNĐ, "
        f"ngủ {requester.get('sleep_schedule')}, sạch sẽ {requester.get('cleanliness')}/5, "
        f"hút thuốc: {requester.get('smoking')}, tính cách: {requester.get('personality')}, "
        f"sở thích: {', '.join(requester.get('interests') or [])}\n\n"
        f"Danh sách các ứng viên ({len(candidates)} người):\n"
    )
    for c in candidates:
        prompt += (
            f"- ID {c.get('id')}: Ngân sách {c.get('budget_min')}-{c.get('budget_max')} VNĐ, "
            f"ngủ {c.get('sleep_schedule')}, sạch sẽ {c.get('cleanliness')}/5, "
            f"hút thuốc: {c.get('smoking')}, tính cách: {c.get('personality')}, "
            f"sở thích: {', '.join(c.get('interests') or [])}\n"
        )

    prompt += (
        f"\nYêu cầu:\n"
        f"1. Chấm điểm tương thích 'score' từ 0 đến 100 cho mỗi ứng viên.\n"
        f"2. Viết 'reason' ngắn gọn, súc tích (1-2 câu tiếng Việt) nêu điểm chung về lối sống, sở thích, ngân sách.\n"
        f"3. Sắp xếp thứ tự từ cao xuống thấp theo 'score', tối đa {max(1, limit)} ứng viên.\n"
        f"4. 'id' trong kết quả PHẢI thuộc danh sách ứng viên đầu vào."
    )

    system_instruction = (
        "Bạn là trợ lý ghép bạn cùng phòng sinh viên thông minh. Đánh giá kỹ sự hòa hợp "
        "về ngân sách, nhịp sinh hoạt (ngủ/thức), mức độ sạch sẽ và thái độ với thuốc lá. "
        "Luôn trả về kết quả JSON chuẩn xác."
    )

    try:
        raw_text = generate_with_fallback(
            client=client,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=RoommatesResponseSchema,
                temperature=0.2,
            ),
        )
        if not raw_text:
            return None
        res_dict = json.loads(raw_text)
        cand_ids = {c["id"] for c in candidates}
        valid_results = [r for r in res_dict.get("results", []) if r.get("id") in cand_ids]
        if valid_results:
            return {"results": valid_results[:limit]}
    except Exception as exc:
        logger.warning(f"Gemini rank_roommates failed: {exc}")
    return None
