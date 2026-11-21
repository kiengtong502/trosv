"""Fallback answers: accent-insensitive keyword matching and accented Vietnamese output."""

import pytest

from app.features.chat.heuristics import reply_chat
from app.features.chat.schemas import ChatReq
from app.features.roommates.heuristics import score_roommates
from app.features.roommates.schemas import RoommatesReq
from app.shared.text import fold, has_any_word, vnd


def test_fold_strips_vietnamese_accents():
    assert fold("Tiền Đặt Cọc") == "tien dat coc"


@pytest.mark.parametrize(
    ("text", "hit"),
    [
        ("Phòng này rẻ không?", True),
        ("Phong nay re khong", True),
        ("Phòng trọ này ở đâu?", False),  # "re" must not match inside "tro"
        ("Không gian thế nào?", False),  # "gia" must not match inside "gian"
    ],
)
def test_price_keyword_is_whole_word(text, hit):
    assert has_any_word(text, ("re", "gia")) is hit


def test_vnd_uses_dot_thousands():
    assert vnd(2500000) == "2.500.000đ"


def test_chat_deposit_question_with_accents_gets_legal_tail():
    reply = reply_chat(ChatReq(message="Tiền cọc thường bao nhiêu?"))["reply"]
    assert reply.startswith("Thông thường tiền cọc")
    assert reply.endswith("không thay thế tư vấn pháp lý.")


def test_chat_general_question_about_tro_is_not_treated_as_price():
    reply = reply_chat(ChatReq(message="Phòng trọ gần trường có an toàn không?"))["reply"]
    assert reply.startswith("Mình có thể giúp")


def test_roommate_sleep_schedule_counts_toward_score():
    req = RoommatesReq(
        requester={"sleep_schedule": "late"},
        candidates=[{"id": 1, "sleep_schedule": "late"}, {"id": 2, "sleep_schedule": "early"}],
    )
    first, second = score_roommates(req)["results"]
    assert (first["id"], second["id"]) == (1, 2)
    assert first["score"] > second["score"]
    assert "cùng hay thức khuya" in first["reason"]
