"""Quality eval against real Gemini: fixed cases, automatic checks, outputs printed for reading.

Run from apps/ai-service with a key (never in CI, it costs tokens):
    FAKE_MODE=false GEMINI_API_KEY=... python -m evals.run_evals [--repeat 3]
Exit code 1 if any check fails.
"""

# ruff: noqa: T201
from __future__ import annotations

import argparse
import re
import sys
from collections.abc import Callable
from typing import Any

from app.features.areas.gemini import recommend_areas_with_gemini
from app.features.chat.gemini import chat_with_gemini
from app.features.description.gemini import generate_description_with_gemini
from app.features.price_advice.gemini import generate_price_advice_with_gemini
from app.features.roommates.gemini import rank_roommates_with_gemini
from app.shared.gemini_client import is_gemini_enabled
from app.shared.text import fold

Check = tuple[str, Callable[[Any], bool]]

LISTING = {
    "title": "Phòng trọ gần ĐH Nông Lâm",
    "price": 2500000,
    "area_m2": 20,
    "address": "12 Đường số 5",
    "ward": "Linh Trung",
    "amenities": ["Wi-Fi", "Chỗ để xe"],
    "description": "Phòng sạch, giờ giấc tự do.",
}
AREAS = [
    {"ward_id": 1, "name": "Linh Trung", "avg_price": 2400000, "avg_rating": 4.1,
     "distance_to_school_km": 0.8, "listings_count": 12},
    {"ward_id": 2, "name": "Bình Thọ", "avg_price": 1700000, "avg_rating": 3.6,
     "distance_to_school_km": 4.5, "listings_count": 20},
    {"ward_id": 3, "name": "Hiệp Phú", "avg_price": 2900000, "avg_rating": 4.7,
     "distance_to_school_km": 6.0, "listings_count": 4},
]  # fmt: skip
REQUESTER = {"budget_min": 1500000, "budget_max": 2500000, "sleep_schedule": "early",
             "cleanliness": 5, "smoking": False, "personality": "introvert",
             "interests": ["đọc sách", "cầu lông"]}  # fmt: skip
CANDIDATES = [
    {"id": 11, "budget_min": 1800000, "budget_max": 2600000, "sleep_schedule": "early",
     "cleanliness": 4, "smoking": False, "personality": "introvert", "interests": ["đọc sách"]},
    {"id": 12, "budget_min": 3000000, "budget_max": 4000000, "sleep_schedule": "late",
     "cleanliness": 2, "smoking": True, "personality": "extrovert", "interests": ["game"]},
]  # fmt: skip


def accented(text: str) -> bool:
    """Vietnamese with diacritics, not ASCII-only."""
    return fold(text) != text.lower()


def mentions(text: str, *words: str) -> bool:
    folded = fold(text)
    return any(fold(w) in folded for w in words)


def has_number(text: str) -> bool:
    return re.search(r"\d", text) is not None


def reply(r: Any) -> str:
    return str((r or {}).get("reply", ""))


def reasons(r: Any) -> list[str]:
    return [str(x.get("reason", "")) for x in (r or {}).get("results", [])]


def ids(r: Any, key: str) -> list[int]:
    return [x[key] for x in (r or {}).get("results", [])]


CASES: list[tuple[str, Callable[[], Any], list[Check]]] = [
    (
        "chat: tiền cọc có câu miễn trừ pháp lý",
        lambda: chat_with_gemini("Đặt cọc phòng trọ thường bao nhiêu tháng?", []),
        [
            ("có câu pháp lý", lambda r: mentions(reply(r), "không thay thế tư vấn pháp lý")),
            ("có dấu", lambda r: accented(reply(r))),
        ],
    ),
    (
        "chat: không bịa tiện ích phòng không có",
        lambda: chat_with_gemini("Phòng này có máy lạnh không?", [], LISTING),
        [
            ("nói chưa có thông tin/không có", lambda r: mentions(reply(r), "không", "chưa")),
            ("có dấu", lambda r: accented(reply(r))),
        ],
    ),
    (
        "chat: trả đúng giá phòng đang xem",
        lambda: chat_with_gemini("Giá phòng này bao nhiêu?", [], LISTING),
        [
            (
                "nêu đúng giá",
                lambda r: mentions(reply(r), "2.500.000", "2,5 triệu", "2500000", "2,500,000"),
            )
        ],
    ),
    (
        "chat: câu hỏi lạc đề được kéo về chủ đề thuê trọ",
        lambda: chat_with_gemini("Viết cho mình một bài thơ về con mèo", []),
        [("nhắc tới phòng/thuê trọ", lambda r: mentions(reply(r), "phòng", "thuê", "trọ"))],
    ),
    (
        "areas: ưu tiên gần trường",
        lambda: recommend_areas_with_gemini(
            {
                "budget_min": 1500000,
                "budget_max": 3000000,
                "priorities": ["near_school"],
                "school": "ĐH Nông Lâm",
                "city": "TP. Hồ Chí Minh",
            },
            AREAS,
        ),
        [
            ("khu gần nhất đứng đầu", lambda r: ids(r, "ward_id")[:1] == [1]),
            ("lý do có con số", lambda r: all(has_number(x) for x in reasons(r))),
            ("có dấu", lambda r: all(accented(x) for x in reasons(r))),
        ],
    ),
    (
        "areas: ưu tiên giá rẻ",
        lambda: recommend_areas_with_gemini(
            {"budget_min": 1500000, "budget_max": 3000000, "priorities": ["cheap"]}, AREAS
        ),
        [("khu rẻ nhất đứng đầu", lambda r: ids(r, "ward_id")[:1] == [2])],
    ),
    (
        "roommates: lý do cụ thể, đúng sự thật",
        lambda: rank_roommates_with_gemini(REQUESTER, CANDIDATES),
        [
            ("người hợp hơn đứng đầu", lambda r: ids(r, "id")[:1] == [11]),
            ("lý do có dấu", lambda r: bool(reasons(r)) and all(accented(x) for x in reasons(r))),
            (
                "không khen ứng viên hút thuốc là 'không hút thuốc'",
                lambda r: (
                    not any(
                        x["id"] == 12 and mentions(x["reason"], "đều không hút thuốc")
                        for x in (r or {}).get("results", [])
                    )
                ),
            ),
        ],
    ),
    (
        "description: độ dài và không bịa tiện ích",
        lambda: generate_description_with_gemini(
            {
                "title": LISTING["title"],
                "type": "room",
                "price": 2500000,
                "area_m2": 20,
                "address": "12 Đường số 5",
                "ward": "Linh Trung",
                "amenities": ["Wi-Fi"],
            }
        ),
        [
            (
                "60-150 từ",
                lambda r: 60 <= len(str((r or {}).get("description", "")).split()) <= 150,
            ),
            ("giá có định dạng", lambda r: "2.500.000" in str((r or {}).get("description", ""))),
            (
                "không nhắc máy lạnh",
                lambda r: (
                    not mentions(str((r or {}).get("description", "")), "máy lạnh", "điều hòa")
                ),
            ),
        ],
    ),
    (
        "price advice: giá cao hơn trung vị 50% phải là 'high'",
        lambda: generate_price_advice_with_gemini(
            {**LISTING, "price": 3500000},
            {"count": 12, "median": 2300000, "min": 1800000, "max": 3000000},
        ),
        [
            ("verdict = high", lambda r: (r or {}).get("verdict") == "high"),
            (
                "khoảng hợp lý theo ±10%",
                lambda r: (
                    ((r or {}).get("fair_min"), (r or {}).get("fair_max")) == (2070000, 2530000)
                ),
            ),
            ("message có dấu", lambda r: accented(str((r or {}).get("message", "")))),
        ],
    ),
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeat", type=int, default=1, help="run each case N times")
    args = parser.parse_args()
    if not is_gemini_enabled():
        print("Cần FAKE_MODE=false và GEMINI_API_KEY để chạy eval với Gemini thật.")
        return 2

    failed = total = 0
    for name, run, checks in CASES:
        for i in range(args.repeat):
            result = run()
            print(f"\n=== {name} (lần {i + 1}) ===\n{result}")
            if result is None:
                print("  ✗ Gemini không trả kết quả (timeout/lỗi)")
                failed, total = failed + 1, total + 1
                continue
            for label, ok in checks:
                passed = ok(result)
                total += 1
                failed += not passed
                print(f"  {'✓' if passed else '✗'} {label}")
    print(f"\nTổng: {total - failed}/{total} check đạt")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
