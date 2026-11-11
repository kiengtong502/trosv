from pydantic import Field

from app.shared.schemas import BaseReq


class DescriptionReq(BaseReq):
    """POST /description - thong tin co ban cua tin dang can viet mo ta."""

    title: str
    type: str | None = None
    price: int | None = None
    area_m2: float | None = None
    address: str | None = None
    ward: str | None = None
    amenities: list[str] | None = Field(default=[])
