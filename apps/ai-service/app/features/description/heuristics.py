from typing import Any

from app.features.description.schemas import DescriptionReq
from app.shared.parsing import int_or

_TYPE_LABELS = {"room": "Phong tro", "apartment": "Can ho", "house": "Nha nguyen can"}


def generate_description(req: DescriptionReq) -> dict[str, Any]:
    """Heuristic description generation."""
    type_label = _TYPE_LABELS.get(req.type or "", "Phong tro")
    parts: list[str] = [f"{type_label} \u201c{req.title}\u201d dang cho thue"]
    if req.area_m2:
        parts.append(f"dien tich {req.area_m2:g} m2")
    if req.ward or req.address:
        parts.append("vi tri " + ", ".join(x for x in [req.address, req.ward] if x))
    if req.amenities:
        parts.append("co san " + ", ".join(req.amenities))
    if req.price:
        parts.append(f"gia thue {int_or(req.price, 0):,} dong mot thang")
    body = (
        ", ".join(parts)
        + ". Khong gian thoang, phu hop sinh vien hoac nguoi di lam muon an toan, tien nghi gan nha. Lien he truc tiep qua tin nhan trong trang de xem phong va trao doi chi tiet."
    )
    words = body.split()
    return {"description": " ".join(words[:130])}
