from typing import Any

from fastapi import APIRouter

from app.features.description.gemini import generate_description_with_gemini
from app.features.description.heuristics import generate_description
from app.features.description.schemas import DescriptionReq
from app.shared.gemini_client import is_gemini_enabled
from app.shared.guard import guard_fake

router = APIRouter()


@router.post("/description")
def description(req: DescriptionReq) -> dict[str, Any]:
    """Viet mo ta tin dang tu thong tin co ban (chi dung du lieu duoc cung cap)."""
    if is_gemini_enabled():
        gemini_res = generate_description_with_gemini(req.model_dump())
        if gemini_res:
            return gemini_res

    guard_fake()
    return generate_description(req)
