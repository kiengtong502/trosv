from typing import Any

from fastapi import APIRouter

from app.features.price_advice.gemini import generate_price_advice_with_gemini
from app.features.price_advice.heuristics import advise_price
from app.features.price_advice.schemas import PriceAdviceReq
from app.shared.gemini_client import is_gemini_enabled
from app.shared.guard import guard_fake

router = APIRouter()


@router.post("/price-advice")
def price_advice(req: PriceAdviceReq) -> dict[str, Any]:
    """Danh gia gia tin dang so voi median thi truong backend tinh san."""
    if is_gemini_enabled():
        gemini_res = generate_price_advice_with_gemini(req.listing, req.stats)
        if gemini_res:
            return gemini_res

    guard_fake()
    return advise_price(req)
