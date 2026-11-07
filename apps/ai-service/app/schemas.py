from typing import Any

from pydantic import BaseModel


class BaseReq(BaseModel):
    """Request base: bo qua truong khong khai bao (contract cho phep)."""

    model_config = {"extra": "ignore"}


class RoommatesReq(BaseReq):
    """POST /roommates - requester + candidate profiles de xep hang."""

    requester: dict[str, Any]
    candidates: list[dict[str, Any]] | None = []
    limit: int = 5


class PriceAdviceReq(BaseReq):
    """POST /price-advice - tin dang + thong ke thi truong tu backend."""

    listing: dict[str, Any]
    stats: dict[str, Any]


class AreasReq(BaseReq):
    """POST /areas - uu tien sinh vien + thong ke tung khu vuc."""

    preferences: dict[str, Any]
    areas: list[dict[str, Any]] | None = []
    limit: int = 3


class ChatReq(BaseReq):
    """POST /chat - cau hoi + lich su hoi thoai + ngu canh tin dang."""

    message: str
    history: list[dict[str, Any]] | None = []
    listing: dict[str, Any] | None = None


class DescriptionReq(BaseReq):
    """POST /description - thong tin co ban cua tin dang can viet mo ta."""

    title: str
    type: str | None = None
    price: int | None = None
    area_m2: float | None = None
    address: str | None = None
    ward: str | None = None
    amenities: list[str] | None = []
