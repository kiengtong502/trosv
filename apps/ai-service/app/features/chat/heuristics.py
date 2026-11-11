from typing import Any

from app.features.chat.schemas import ChatReq
from app.shared.parsing import int_or

_DEPOSIT_KW = ("coc", "deposit", "hop dong", "contract", "phap ly")
_PRICE_KW = ("gia", "price", "bao nhieu", "re", "muc gia")


def _reply_about_deposit() -> str:
    """Cau tra loi FAKE_MODE cho nhom cau hoi tien coc/hop dong."""
    return (
        "Thong thuong tien coc bang 1 den 2 thang tien phong, va can ky hop dong "
        "ghi ro tien coc, gia thue, ky han va dieu khoan hoan tra. Truoc khi ky, "
        "hay kiem tra giay to chu nha, doc ky dieu khoan ve quan ly va sua chua."
    )


def _reply_about_price(listing: dict[str, Any] | None) -> str:
    """Cau tra loi FAKE_MODE cho nhom cau hoi ve gia (co/khong ngu canh tin)."""
    if listing:
        return (
            f"Tin \u201c{listing.get('title')}\u201d co gia {int_or(listing.get('price'), 0):,} "
            f"cho {listing.get('area_m2')} m2 tai {listing.get('ward')}. Ban co the dung "
            "tinh nang Tu van gia AI ngay trang chi tiet phong de so sanh voi cac tin tuong tu."
        )
    return (
        "Gia phong tro khu vuc thuoc dai hoc thuong tu 1,5 den 4 trieu mot thang "
        "tuy dien tich va tien ich. Ban vao trang Ban do hoac Tim phong, loc theo "
        "khoang gia va khoang cach toi truong de thay muc pho bien quanh ban."
    )


def _reply_about_listing(listing: dict[str, Any]) -> str:
    """Cau tra loi FAKE_MODE khi ngu canh la mot tin dang cu the."""
    return (
        f"Ve tin \u201c{listing.get('title')}\u201d tai {listing.get('address')}: "
        "ban co the xem anh, tien ich va danh gia tren trang chi tiet. Neu thich, "
        "bam Nhan tin de noi chuyen truc tiep voi chu nha."
    )


def reply_chat(req: ChatReq) -> dict[str, Any]:
    """Heuristic chatbot replies."""
    msg = req.message.lower()
    tail = " Thong tin mang tinh tham khao, khong thay the tu van phap ly."
    if any(k in msg for k in _DEPOSIT_KW):
        return {"reply": _reply_about_deposit() + tail}
    if any(k in msg for k in _PRICE_KW):
        return {"reply": _reply_about_price(req.listing)}
    if req.listing:
        return {"reply": _reply_about_listing(req.listing)}
    return {
        "reply": (
            "Minh co the giu ve tim phong, gia ca, tien coc va hop dong thue tro. "
            "Ban muon hoi dieu gi truoc?"
        )
    }
