from typing import Any

from fastapi import APIRouter

from app.features.areas.gemini import recommend_areas_with_gemini
from app.features.areas.heuristics import recommend_areas
from app.features.areas.schemas import AreasReq
from app.shared.gemini_client import is_gemini_enabled
from app.shared.guard import guard_fake

router = APIRouter()


@router.post("/areas")
def areas(req: AreasReq) -> dict[str, Any]:
    """Xep hang khu vuc theo ngan sach + uu tien: tot nhat truoc."""
    if is_gemini_enabled() and req.areas:
        gemini_res = recommend_areas_with_gemini(req.preferences, req.areas, req.limit)
        if gemini_res:
            return gemini_res

    guard_fake()
    return recommend_areas(req)
