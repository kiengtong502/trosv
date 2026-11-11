from typing import Any

from app.shared.schemas import BaseReq


class PriceAdviceReq(BaseReq):
    """POST /price-advice - tin dang + thong ke thi truong tu backend."""

    listing: dict[str, Any]
    stats: dict[str, Any]
