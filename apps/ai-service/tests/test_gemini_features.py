"""Per-feature Gemini modules with the LLM stubbed (no network, no key)."""

import json
from types import SimpleNamespace
from typing import Any

import pytest

from app.features.areas import gemini as areas
from app.features.chat import gemini as chat
from app.features.description import gemini as description
from app.features.price_advice import gemini as price_advice
from app.features.roommates import gemini as roommates


@pytest.fixture
def llm(monkeypatch):
    """Install a stub LLM into a feature module; returns the recorded calls."""

    def install(module: Any, reply: Any = None, *, client: bool = True) -> list[SimpleNamespace]:
        calls: list[SimpleNamespace] = []

        def fake_generate(*, client: Any, contents: Any, config: Any) -> str | None:
            calls.append(SimpleNamespace(client=client, contents=contents, config=config))
            if isinstance(reply, Exception):
                raise reply
            return reply

        monkeypatch.setattr(module, "get_client", lambda: object() if client else None)
        monkeypatch.setattr(module, "generate_with_fallback", fake_generate)
        return calls

    return install


def dumps(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False)


# Replies that must make every feature fall back (return None) instead of raising.
BAD_REPLIES = [None, "", "not json", "[", Exception("sdk exploded")]


# ======================================================================= areas

AREAS_IN = [
    {"ward_id": 1, "name": "Thủ Đức", "avg_price": 2300000, "avg_rating": 4.2,
     "distance_to_school_km": 1.2, "listings_count": 41},
    {"ward_id": 2, "name": "Dĩ An", "avg_price": 1800000, "listings_count": 5},
    {"ward_id": 3, "name": "Linh Trung", "avg_price": 2100000, "listings_count": 9},
]  # fmt: skip
PREFS = {"budget_min": 1500000, "budget_max": 3000000, "priorities": ["cheap", "near"]}


def test_areas_returns_valid_results_only(llm):
    llm(
        areas, dumps({"results": [{"ward_id": 1, "reason": "gần"}, {"ward_id": 99, "reason": "x"}]})
    )
    assert areas.recommend_areas_with_gemini(PREFS, AREAS_IN) == {
        "results": [{"ward_id": 1, "reason": "gần"}]
    }


def test_areas_limit_truncates_results(llm):
    reply = [{"ward_id": i, "reason": "r"} for i in (1, 2, 3)]
    llm(areas, dumps({"results": reply}))
    assert len(areas.recommend_areas_with_gemini(PREFS, AREAS_IN, limit=2)["results"]) == 2


def test_areas_all_ids_invalid_returns_none(llm):
    llm(areas, dumps({"results": [{"ward_id": 99, "reason": "x"}]}))
    assert areas.recommend_areas_with_gemini(PREFS, AREAS_IN) is None


@pytest.mark.parametrize("reply", BAD_REPLIES)
def test_areas_bad_reply_returns_none(llm, reply):
    llm(areas, reply)
    assert areas.recommend_areas_with_gemini(PREFS, AREAS_IN) is None


def test_areas_without_client_or_areas_never_calls_llm(llm):
    calls = llm(areas, dumps({"results": []}), client=False)
    assert areas.recommend_areas_with_gemini(PREFS, AREAS_IN) is None
    calls = llm(areas, dumps({"results": []}))
    assert areas.recommend_areas_with_gemini(PREFS, []) is None
    assert calls == []


def test_areas_prompt_has_budget_priorities_and_area_data(llm):
    calls = llm(areas, dumps({"results": []}))
    areas.recommend_areas_with_gemini(PREFS, AREAS_IN, limit=2)
    prompt = calls[0].contents
    assert "1,500,000 - 3,000,000" in prompt
    assert "cheap, near" in prompt
    assert "ward_id 1 (Thủ Đức)" in prompt
    assert "1.2 km" in prompt
    assert "4.2/5" in prompt
    assert "tối đa 2 khu vực" in prompt


def test_areas_prompt_handles_missing_optional_data(llm):
    calls = llm(areas, dumps({"results": []}))
    areas.recommend_areas_with_gemini({}, [{"ward_id": 2, "name": "Dĩ An"}])
    prompt = calls[0].contents
    assert "giá hợp lý" in prompt  # default priority
    assert "chưa có khoảng cách" in prompt
    assert "chưa có đánh giá" in prompt


def test_areas_requests_json_schema(llm):
    calls = llm(areas, dumps({"results": []}))
    areas.recommend_areas_with_gemini(PREFS, AREAS_IN)
    config = calls[0].config
    assert config.response_mime_type == "application/json"
    assert config.response_schema is areas.AreasResponseSchema


# ===================================================================== roommates

REQUESTER = {"budget_min": 1000000, "budget_max": 2500000, "sleep_schedule": "early",
             "cleanliness": 4, "smoking": False, "personality": "calm", "interests": ["music"]}  # fmt: skip
CANDIDATES = [
    {"id": 7, "budget_min": 900000, "budget_max": 2400000, "interests": ["music", "film"]},
    {"id": 8, "interests": []},
    {"id": 9},
]


def test_roommates_returns_valid_results_only(llm):
    reply = {
        "results": [{"id": 7, "score": 90, "reason": "hợp"}, {"id": 1, "score": 99, "reason": "?"}]
    }
    llm(roommates, dumps(reply))
    assert roommates.rank_roommates_with_gemini(REQUESTER, CANDIDATES) == {
        "results": [{"id": 7, "score": 90, "reason": "hợp"}]
    }


def test_roommates_limit_truncates_results(llm):
    reply = [{"id": i, "score": 50, "reason": "r"} for i in (7, 8, 9)]
    llm(roommates, dumps({"results": reply}))
    assert len(roommates.rank_roommates_with_gemini(REQUESTER, CANDIDATES, limit=1)["results"]) == 1


def test_roommates_all_ids_invalid_returns_none(llm):
    llm(roommates, dumps({"results": [{"id": 1, "score": 1, "reason": "x"}]}))
    assert roommates.rank_roommates_with_gemini(REQUESTER, CANDIDATES) is None


@pytest.mark.parametrize("reply", BAD_REPLIES)
def test_roommates_bad_reply_returns_none(llm, reply):
    llm(roommates, reply)
    assert roommates.rank_roommates_with_gemini(REQUESTER, CANDIDATES) is None


def test_roommates_without_client_or_candidates_never_calls_llm(llm):
    llm(roommates, "{}", client=False)
    assert roommates.rank_roommates_with_gemini(REQUESTER, CANDIDATES) is None
    calls = llm(roommates, "{}")
    assert roommates.rank_roommates_with_gemini(REQUESTER, []) is None
    assert calls == []


def test_roommates_prompt_lists_requester_and_every_candidate(llm):
    calls = llm(roommates, dumps({"results": []}))
    roommates.rank_roommates_with_gemini(REQUESTER, CANDIDATES, limit=3)
    prompt = calls[0].contents
    assert "1000000-2500000" in prompt
    assert "sở thích: music" in prompt
    assert "Danh sách các ứng viên (3 người)" in prompt
    for cid in (7, 8, 9):
        assert f"ID {cid}:" in prompt
    assert "music, film" in prompt
    assert "tối đa 3 ứng viên" in prompt


# ================================================================== price advice

LISTING = {
    "type": "room",
    "price": 2500000,
    "area_m2": 22.5,
    "ward": "Thủ Đức",
    "amenities": ["Wi-Fi"],
}
STATS = {"count": 12, "min": 1800000, "median": 2300000, "max": 3200000}
ADVICE = {"verdict": "high", "fair_min": 2000000, "fair_max": 2400000,
          "tips": ["a", "b"], "message": "Chào anh"}  # fmt: skip


def test_price_advice_returns_model_answer(llm):
    llm(price_advice, dumps(ADVICE))
    assert price_advice.generate_price_advice_with_gemini(LISTING, STATS) == ADVICE


@pytest.mark.parametrize("verdict", ["high", "fair", "low"])
def test_price_advice_accepts_all_three_verdicts(llm, verdict):
    llm(price_advice, dumps({**ADVICE, "verdict": verdict}))
    result = price_advice.generate_price_advice_with_gemini(LISTING, STATS)
    assert result is not None
    assert result["verdict"] == verdict


@pytest.mark.parametrize(
    "reply", [dumps({**ADVICE, "verdict": "expensive"}), dumps({}), dumps([1])]
)
def test_price_advice_rejects_unknown_shapes(llm, reply):
    llm(price_advice, reply)
    assert price_advice.generate_price_advice_with_gemini(LISTING, STATS) is None


@pytest.mark.parametrize("reply", BAD_REPLIES)
def test_price_advice_bad_reply_returns_none(llm, reply):
    llm(price_advice, reply)
    assert price_advice.generate_price_advice_with_gemini(LISTING, STATS) is None


def test_price_advice_without_client_returns_none(llm):
    llm(price_advice, dumps(ADVICE), client=False)
    assert price_advice.generate_price_advice_with_gemini(LISTING, STATS) is None


def test_price_advice_prompt_has_listing_and_market_stats(llm):
    calls = llm(price_advice, dumps(ADVICE))
    price_advice.generate_price_advice_with_gemini(LISTING, STATS)
    prompt = calls[0].contents
    assert "2500000 VNĐ/tháng" in prompt
    assert "từ 12 tin tương tự" in prompt
    assert "Trung vị (median): 2300000" in prompt
    assert "Wi-Fi" in prompt


def test_price_advice_prompt_defaults_missing_count_to_zero(llm):
    calls = llm(price_advice, dumps(ADVICE))
    price_advice.generate_price_advice_with_gemini({}, {})
    assert "từ 0 tin tương tự" in calls[0].contents


# ==================================================================== description


def test_description_is_stripped(llm):
    llm(description, dumps({"description": "  Phòng sạch sẽ.  \n"}))
    assert description.generate_description_with_gemini({"title": "x"}) == {
        "description": "Phòng sạch sẽ."
    }


@pytest.mark.parametrize(
    "reply", [dumps({}), dumps({"description": 5}), dumps({"description": None})]
)
def test_description_rejects_missing_or_non_string(llm, reply):
    llm(description, reply)
    assert description.generate_description_with_gemini({"title": "x"}) is None


@pytest.mark.parametrize("reply", BAD_REPLIES)
def test_description_bad_reply_returns_none(llm, reply):
    llm(description, reply)
    assert description.generate_description_with_gemini({"title": "x"}) is None


def test_description_without_client_returns_none(llm):
    llm(description, dumps({"description": "x"}), client=False)
    assert description.generate_description_with_gemini({"title": "x"}) is None


def test_description_prompt_uses_only_provided_data(llm):
    calls = llm(description, dumps({"description": "x"}))
    description.generate_description_with_gemini(
        {"title": "Phòng gần ĐHQG", "type": "room", "price": 2500000, "area_m2": 22.5,
         "address": "1 Võ Văn Ngân", "ward": "Thủ Đức", "amenities": ["Wi-Fi", "Máy lạnh"]}
    )  # fmt: skip
    prompt = calls[0].contents
    for fragment in ("Phòng gần ĐHQG", "2500000", "22.5", "1 Võ Văn Ngân", "Wi-Fi, Máy lạnh"):
        assert fragment in prompt
    assert "KHÔNG tự bịa đặt" in prompt


def test_description_prompt_defaults_for_missing_fields(llm):
    calls = llm(description, dumps({"description": "x"}))
    description.generate_description_with_gemini({})
    prompt = calls[0].contents
    assert "thỏa thuận" in prompt
    assert "không rõ" in prompt
    assert "cơ bản" in prompt


# ========================================================================== chat


def parts(content: Any) -> str:
    return str(content.parts[0].text)


def test_chat_returns_stripped_reply(llm):
    llm(chat, dumps({"reply": "  Xin chào  "}))
    assert chat.chat_with_gemini("hi", []) == {"reply": "Xin chào"}


@pytest.mark.parametrize("reply", [dumps({"reply": "   "}), dumps({})])
def test_chat_blank_or_missing_reply_returns_none(llm, reply):
    llm(chat, reply)
    assert chat.chat_with_gemini("hi", []) is None


@pytest.mark.parametrize("reply", BAD_REPLIES)
def test_chat_bad_reply_returns_none(llm, reply):
    llm(chat, reply)
    assert chat.chat_with_gemini("hi", []) is None


def test_chat_without_client_returns_none(llm):
    llm(chat, dumps({"reply": "x"}), client=False)
    assert chat.chat_with_gemini("hi", []) is None


def test_chat_last_content_is_the_user_message(llm, monkeypatch):
    monkeypatch.setattr(chat, "KNOWLEDGE_BASE", "")
    calls = llm(chat, dumps({"reply": "ok"}))
    chat.chat_with_gemini("Cọc bao nhiêu?", [])
    contents = calls[0].contents
    assert len(contents) == 1
    assert contents[0].role == "user"
    assert parts(contents[0]) == "Cọc bao nhiêu?"


def test_chat_injects_knowledge_base_and_listing_before_history(llm, monkeypatch):
    monkeypatch.setattr(chat, "KNOWLEDGE_BASE", "KB-TEXT")
    calls = llm(chat, dumps({"reply": "ok"}))
    chat.chat_with_gemini(
        "hỏi",
        [{"role": "user", "content": "trước"}],
        {"title": "Phòng A", "price": 123, "amenities": ["Wi-Fi"]},
    )
    contents = calls[0].contents
    assert [c.role for c in contents] == ["user", "model", "user", "user"]
    assert "KB-TEXT" in parts(contents[0])
    assert "Phòng A" in parts(contents[0])
    assert "Wi-Fi" in parts(contents[0])
    assert parts(contents[2]) == "trước"
    assert parts(contents[3]) == "hỏi"


def test_chat_without_context_sections_adds_no_preamble(llm, monkeypatch):
    monkeypatch.setattr(chat, "KNOWLEDGE_BASE", "")
    calls = llm(chat, dumps({"reply": "ok"}))
    chat.chat_with_gemini("hỏi", [{"role": "user", "content": "a"}], None)
    assert [c.role for c in calls[0].contents] == ["user", "user"]


def test_chat_keeps_only_last_ten_turns(llm, monkeypatch):
    monkeypatch.setattr(chat, "KNOWLEDGE_BASE", "")
    calls = llm(chat, dumps({"reply": "ok"}))
    history = [{"role": "user", "content": f"m{i}"} for i in range(15)]
    chat.chat_with_gemini("now", history)
    texts = [parts(c) for c in calls[0].contents]
    assert texts[:-1] == [f"m{i}" for i in range(5, 15)]
    assert texts[-1] == "now"


def test_chat_maps_roles_and_skips_blank_turns(llm, monkeypatch):
    monkeypatch.setattr(chat, "KNOWLEDGE_BASE", "")
    calls = llm(chat, dumps({"reply": "ok"}))
    history = [
        {"role": "user", "content": "câu hỏi"},
        {"role": "assistant", "content": "trả lời"},
        {"role": "user", "content": "   "},
        {"role": "user"},
    ]
    chat.chat_with_gemini("tiếp", history)
    pairs = [(c.role, parts(c)) for c in calls[0].contents]
    assert pairs == [("user", "câu hỏi"), ("model", "trả lời"), ("user", "tiếp")]


def test_chat_system_prompt_requires_legal_disclaimer(llm):
    calls = llm(chat, dumps({"reply": "ok"}))
    chat.chat_with_gemini("hi", [])
    instruction = calls[0].config.system_instruction
    assert "không thay thế tư vấn pháp lý" in instruction
    assert "Luôn trả lời bằng tiếng Việt" in instruction
    assert calls[0].config.response_schema is chat.ChatResponseSchema
