from typing import Any

from app.features.description.schemas import DescriptionReq
from app.shared.parsing import int_or

_TYPE_LABELS = {"room": "Phòng trọ", "apartment": "Căn hộ", "house": "Nhà nguyên căn"}


def generate_description(req: DescriptionReq) -> dict[str, Any]:
    """Heuristic description generation."""
    type_label = _TYPE_LABELS.get(req.type or "", "Phòng trọ")
    parts: list[str] = [f"{type_label} \u201c{req.title}\u201d đang cho thuê"]
    if req.area_m2:
        parts.append(f"diện tích {req.area_m2:g} m²")
    location = req.address or ""
    if req.ward and req.ward.casefold() not in location.casefold():
        location = ", ".join(x for x in [location, req.ward] if x)
    if location:
        parts.append("địa chỉ " + location)
    if req.amenities:
        parts.append("tiện ích gồm " + ", ".join(req.amenities))
    if req.price:
        parts.append(f"giá thuê {int_or(req.price, 0):,} đồng/tháng")
    body = (
        ", ".join(parts)
        + ". Liên hệ trực tiếp với chủ nhà qua tin nhắn trên TROSV để hỏi thêm thông tin và hẹn xem phòng."
    )
    words = body.split()
    return {"description": " ".join(words[:130])}
