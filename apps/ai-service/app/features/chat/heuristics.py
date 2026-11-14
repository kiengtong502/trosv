import unicodedata
from typing import Any

from app.features.chat.schemas import ChatReq
from app.shared.parsing import int_or

_DEPOSIT_KW = ("coc", "deposit", "hop dong", "contract", "phap ly")
_PRICE_KW = ("gia", "price", "bao nhieu", "re", "muc gia")


def _reply_about_deposit() -> str:
    """Cau tra loi FAKE_MODE cho nhom cau hoi tien coc/hop dong."""
    return (
        "Tiền cọc thường được thỏa thuận theo từng phòng. Bạn nên yêu cầu biên nhận "
        "và hợp đồng ghi rõ tiền cọc, giá thuê, kỳ hạn và điều kiện hoàn trả. Trước khi ký, "
        "hãy kiểm tra giấy tờ chủ nhà và đọc kỹ điều khoản về quản lý, sửa chữa."
    )


def _reply_about_price(listing: dict[str, Any] | None) -> str:
    """Cau tra loi FAKE_MODE cho nhom cau hoi ve gia (co/khong ngu canh tin)."""
    if listing:
        return (
            f"Tin \u201c{listing.get('title')}\u201d có giá {int_or(listing.get('price'), 0):,} "
            f"đồng/tháng cho {listing.get('area_m2')} m² tại {listing.get('ward')}. Bạn có thể dùng "
            "tính năng Gợi ý giá ngay trang chi tiết phòng để so sánh với các tin tương tự."
        )
    return (
        "Bạn vào trang Tìm phòng, lọc theo khoảng giá và trường học để xem giá các tin "
        "đang đăng. Mở chi tiết phòng và dùng Gợi ý giá để so sánh với các phòng tương tự."
    )


def _reply_about_listing(listing: dict[str, Any]) -> str:
    """Cau tra loi FAKE_MODE khi ngu canh la mot tin dang cu the."""
    return (
        f"Về tin \u201c{listing.get('title')}\u201d tại {listing.get('address')}, "
        "bạn có thể xem ảnh, tiện ích và đánh giá trên trang chi tiết. "
        "Bấm Nhắn tin để trao đổi trực tiếp với chủ nhà."
    )


def reply_chat(req: ChatReq) -> dict[str, Any]:
    """Heuristic chatbot replies."""
    msg = "".join(
        c for c in unicodedata.normalize("NFD", req.message.lower()) if not unicodedata.combining(c)
    ).replace("đ", "d")
    tail = " Thông tin mang tính tham khảo, không thay thế tư vấn pháp lý."
    if any(k in msg for k in _DEPOSIT_KW):
        return {"reply": _reply_about_deposit() + tail}
    if any(k in msg for k in _PRICE_KW):
        return {"reply": _reply_about_price(req.listing)}
    if req.listing:
        return {"reply": _reply_about_listing(req.listing)}
    return {
        "reply": (
            "Mình có thể hỗ trợ về tìm phòng, giá cả, tiền cọc và hợp đồng thuê trọ. "
            "Bạn muốn hỏi điều gì trước?"
        )
    }
