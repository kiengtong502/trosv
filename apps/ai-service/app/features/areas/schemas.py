from typing import Any

from pydantic import Field

from app.shared.schemas import BaseReq


class AreasReq(BaseReq):
    """POST /areas - uu tien sinh vien + thong ke tung khu vuc."""

    preferences: dict[str, Any]
    areas: list[dict[str, Any]] | None = Field(default=[])
    limit: int = 3
