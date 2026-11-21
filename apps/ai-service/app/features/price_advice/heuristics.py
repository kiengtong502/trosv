from typing import Any

from fastapi import HTTPException

from app.features.price_advice.schemas import PriceAdviceReq
from app.shared.parsing import int_or
from app.shared.text import vnd


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
    # Same ±10% band the verdict uses, so "low"/"high" never sits inside it.
    fair_min = int(median * 0.9)
    fair_max = int(median * 1.1)
    compare = {"high": "cao hơn", "low": "thấp hơn"}.get(verdict, "tương đương")
    return {
        "verdict": verdict,
        "fair_min": fair_min,
        "fair_max": fair_max,
        "tips": [
            "Hỏi giá khi thuê dài hạn từ 6 tháng trở lên",
            "So sánh với các phòng cùng diện tích trong khu vực",
            "Hỏi rõ tiền điện, nước tính theo đồng hồ hay khoán cố định",
        ],
        "message": (
            f"Chào anh/chị, em thấy mức giá {vnd(price)} {compare} giá trung bình khu vực "
            f"(khoảng {vnd(median)}). Anh/chị có thể xem xét lại giá một chút được không ạ?"
        ),
    }
