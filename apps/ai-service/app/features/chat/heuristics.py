from typing import Any

from app.features.chat.schemas import ChatReq
from app.shared.parsing import int_or
from app.shared.text import has_any_word, vnd

_DEPOSIT_KW = ("coc", "dat coc", "deposit", "hop dong", "contract", "phap ly")
_PRICE_KW = ("gia", "price", "bao nhieu", "re", "muc gia", "tien phong")
LEGAL_TAIL = " Thông tin mang tính tham khảo, không thay thế tư vấn pháp lý."


def _reply_about_deposit() -> str:
    """Cau tra loi FAKE_MODE cho nhom cau hoi tien coc/hop dong."""
    return (
        "Thông thường tiền cọc bằng 1 đến 2 tháng tiền phòng. Bạn nên ký hợp đồng ghi rõ "
        "tiền cọc, giá thuê, kỳ hạn và điều kiện hoàn cọc. Trước khi ký, hãy kiểm tra giấy tờ "
        "của chủ nhà và đọc kỹ điều khoản về sửa chữa, tăng giá."
    )


def _reply_about_price(listing: dict[str, Any] | None) -> str:
    """Cau tra loi FAKE_MODE cho nhom cau hoi ve gia (co/khong ngu canh tin)."""
    if listing:
        return (
            f"Phòng “{listing.get('title')}” có giá {vnd(int_or(listing.get('price'), 0))}/tháng "
            f"cho {listing.get('area_m2')} m² tại {listing.get('ward')}. Bạn có thể dùng "
            "Tư vấn giá AI ngay trên trang chi tiết để so với các phòng tương tự."
        )
    return (
        "Giá phòng trọ gần các trường đại học thường từ 1,5 đến 4 triệu mỗi tháng, tùy diện tích "
        "và tiện ích. Bạn vào trang Tìm phòng, lọc theo khoảng giá và khoảng cách tới trường để "
        "xem mức phổ biến quanh mình."
    )


def _reply_about_listing(listing: dict[str, Any]) -> str:
    """Cau tra loi FAKE_MODE khi ngu canh la mot tin dang cu the."""
    return (
        f"Về phòng “{listing.get('title')}” tại {listing.get('address')}: bạn có thể xem "
        "ảnh, tiện ích và đánh giá trên trang chi tiết. Nếu thấy hợp, bấm Nhắn tin để trao đổi "
        "trực tiếp với chủ nhà."
    )


def reply_chat(req: ChatReq) -> dict[str, Any]:
    """Heuristic chatbot replies."""
    if has_any_word(req.message, _DEPOSIT_KW):
        return {"reply": _reply_about_deposit() + LEGAL_TAIL}
    if has_any_word(req.message, _PRICE_KW):
        return {"reply": _reply_about_price(req.listing)}
    if req.listing:
        return {"reply": _reply_about_listing(req.listing)}
    return {
        "reply": (
            "Mình có thể giúp về tìm phòng, giá cả, tiền cọc và hợp đồng thuê trọ. "
            "Bạn muốn hỏi điều gì trước?"
        )
    }
