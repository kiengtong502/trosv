from typing import Any

from fastapi import APIRouter

from app.features.roommates.gemini import rank_roommates_with_gemini
from app.features.roommates.heuristics import score_roommates
from app.features.roommates.schemas import RoommatesReq
from app.shared.gemini_client import is_gemini_enabled
from app.shared.guard import guard_fake

router = APIRouter()


@router.post("/roommates")
def roommates(req: RoommatesReq) -> dict[str, Any]:
    """Xep hang ung vien ban cung phong: tot nhat truoc, toi da `limit`."""
    if is_gemini_enabled() and req.candidates:
        gemini_res = rank_roommates_with_gemini(req.requester, req.candidates, req.limit)
        if gemini_res:
            return gemini_res

    guard_fake()
    return score_roommates(req)
