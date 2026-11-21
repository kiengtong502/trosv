"""Gemini writes the reasons for a roommate ranking the heuristics already scored."""

from __future__ import annotations

import json
import logging
from typing import Any

from google.genai import types
from pydantic import BaseModel, Field

from app.features.roommates.heuristics import describe_profile, score_roommates
from app.features.roommates.schemas import RoommatesReq
from app.shared.gemini_client import generate_with_fallback, get_client

logger = logging.getLogger("ai_service.gemini.roommates")


class RoommateItem(BaseModel):
    id: int = Field(..., description="ID của ứng viên")
    reason: str = Field(..., description="Lý do tương thích ngắn gọn bằng tiếng Việt")


class RoommatesResponseSchema(BaseModel):
    results: list[RoommateItem] = Field(..., description="Lý do cho từng ứng viên")


def rank_roommates_with_gemini(
    requester: dict[str, Any], candidates: list[dict[str, Any]], limit: int = 5
) -> dict[str, Any] | None:
    """Rank with the deterministic score, then let Gemini explain each match.

    Scores stay reproducible (same profiles -> same order); the model only writes `reason`.
    """
    client = get_client()
    if not client or not candidates:
        return None

    ranked = score_roommates(RoommatesReq(requester=requester, candidates=candidates, limit=limit))[
        "results"
    ]
    by_id = {c["id"]: c for c in candidates}

    prompt = (
        f"Người tìm bạn cùng phòng: {describe_profile(requester)}\n\n"
        f"Các ứng viên đã được xếp hạng (điểm 0-100 đã tính sẵn, KHÔNG thay đổi):\n"
    )
    for r in ranked:
        prompt += f"- ID {r['id']} (điểm {r['score']}): {describe_profile(by_id[r['id']])}\n"
    prompt += (
        "\nYêu cầu: với MỖI ứng viên ở trên, viết 'reason' 1-2 câu tiếng Việt có dấu, xưng 'bạn', "
        "nêu điểm hợp cụ thể nhất (ngân sách, giờ ngủ, sạch sẽ, thuốc lá, sở thích) và nếu có "
        "một điểm khác biệt đáng lưu ý thì nói nhẹ nhàng. Chỉ dùng thông tin ở trên, không bịa. "
        "'id' PHẢI thuộc danh sách."
    )

    system_instruction = (
        "Bạn là trợ lý ghép bạn cùng phòng cho sinh viên. Viết ngắn, thân thiện, trung thực. "
        "Luôn trả về JSON đúng cấu trúc."
    )

    try:
        raw_text = generate_with_fallback(
            client=client,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=RoommatesResponseSchema,
                temperature=0.4,
            ),
        )
        if not raw_text:
            return None
        rows = json.loads(raw_text).get("results", [])
        reasons = {
            row["id"]: row["reason"].strip()
            for row in rows
            if row.get("id") in by_id
            and isinstance(row.get("reason"), str)
            and row["reason"].strip()
        }
        if reasons:
            return {"results": [{**r, "reason": reasons.get(r["id"], r["reason"])} for r in ranked]}
    except Exception as exc:
        logger.warning(f"Gemini rank_roommates failed: {exc}")
    return None
