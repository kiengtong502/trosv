from typing import Any

from fastapi import HTTPException

from app.features.price_advice.schemas import PriceAdviceReq
from app.shared.parsing import int_or


def advise_price(req: PriceAdviceReq) -> dict[str, Any]:
    """Heuristic price evaluation."""
    price = int_or(req.listing.get("price"), 0)
    median = int_or(req.stats.get("median"), 0)
    if median <= 0:
        raise HTTPException(status_code=422, detail="stats.median thieu")
    if price > median * 1.1:
        verdict = "high"
    elif price < median * 0.9:
        verdict = "low"
    else:
        verdict = "fair"
    fair_min = int_or(req.stats.get("min"), int(median * 0.9))
    fair_max = int_or(req.stats.get("max"), int(median * 1.1))
    compare = (
        "cao hon" if verdict == "high" else ("thap hon" if verdict == "low" else "tuong duong")
    )
    return {
        "verdict": verdict,
        "fair_min": fair_min,
        "fair_max": fair_max,
        "tips": [
            "Hoi ve gia cho thue dai han tu 6 thang",
            "So sanh voi cac phong co dien tich tuong tu trong khu vuc",
            "Kiem tra tien dien, nuoc co tinh theo dong ho hay khoan cu",
        ],
        "message": (
            f"Chao anh/chi, em thay muc gia {price:,} vay {compare} gia trung binh "
            f" khu vuc (khoang {median:,}). Anh/chi co the xem xet chinh lai mot chut duoc khong ah?"
        ).replace(" ,", ","),
    }
