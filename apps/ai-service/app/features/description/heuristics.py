from typing import Any

from app.features.description.schemas import DescriptionReq
from app.shared.parsing import int_or
from app.shared.text import vnd

_TYPE_LABELS = {"room": "Phòng trọ", "apartment": "Căn hộ", "house": "Nhà nguyên căn"}


def generate_description(req: DescriptionReq) -> dict[str, Any]:
    """Heuristic description generation."""
    type_label = _TYPE_LABELS.get(req.type or "", "Phòng trọ")
    parts: list[str] = [f"{type_label} \u201c{req.title}\u201d đang cho thuê"]
    if req.area_m2:
        parts.append(f"diện tích {req.area_m2:g} m²")
    if req.ward or req.address:
        parts.append("vị trí " + ", ".join(x for x in [req.address, req.ward] if x))
    if req.amenities:
        parts.append("có sẵn " + ", ".join(req.amenities))
    if req.price:
        parts.append(f"giá thuê {vnd(int_or(req.price, 0))}/tháng")
    body = (
        ", ".join(parts)
        + ". Không gian thoáng, phù hợp sinh viên hoặc người đi làm muốn ở an toàn, tiện nghi. Liên hệ qua tin nhắn trên trang để hẹn xem phòng và trao đổi chi tiết."
    )
    words = body.split()
    return {"description": " ".join(words[:130])}
