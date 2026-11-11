"""Router decisions when Gemini is configured: LLM answer vs heuristic fallback."""

import importlib
from typing import Any

import pytest
from fastapi.testclient import TestClient

import app.main as app_main

SENTINEL = {"from": "gemini"}

# endpoint, feature package, gemini function used by the router, payload, key in heuristic answer
CASES = [
    (
        "/roommates",
        "roommates",
        "rank_roommates_with_gemini",
        {"requester": {"budget_min": 1, "budget_max": 9}, "candidates": [{"id": 1}], "limit": 5},
        "results",
    ),
    (
        "/price-advice",
        "price_advice",
        "generate_price_advice_with_gemini",
        {"listing": {"price": 2500000}, "stats": {"count": 3, "median": 2300000}},
        "verdict",
    ),
    (
        "/areas",
        "areas",
        "recommend_areas_with_gemini",
        {"preferences": {"budget_max": 3000000}, "areas": [{"ward_id": 1, "name": "A"}]},
        "results",
    ),
    ("/chat", "chat", "chat_with_gemini", {"message": "Tiền cọc là gì?"}, "reply"),
    (
        "/description",
        "description",
        "generate_description_with_gemini",
        {"title": "Phòng trọ", "type": "room", "price": 2500000},
        "description",
    ),
]
IDS = [case[0] for case in CASES]


@pytest.fixture
def client():
    return TestClient(app_main.app)


@pytest.fixture
def live_gemini(monkeypatch):
    """Production-like config: key present and FAKE_MODE off."""
    monkeypatch.setenv("FAKE_MODE", "false")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.setattr(app_main, "FAKE_MODE", False)


def stub_gemini(monkeypatch, package: str, fn_name: str, result: Any) -> list[tuple[Any, ...]]:
    calls: list[tuple[Any, ...]] = []

    def fake(*args: Any, **kwargs: Any) -> Any:
        calls.append(args or tuple(kwargs.values()))
        return result

    router = importlib.import_module(f"app.features.{package}.router")
    monkeypatch.setattr(router, fn_name, fake)
    return calls


@pytest.mark.parametrize(("endpoint", "package", "fn_name", "payload", "key"), CASES, ids=IDS)
def test_gemini_answer_is_returned_verbatim(
    client, live_gemini, monkeypatch, endpoint, package, fn_name, payload, key
):
    calls = stub_gemini(monkeypatch, package, fn_name, SENTINEL)
    response = client.post(endpoint, json=payload)
    assert response.status_code == 200
    assert response.json() == SENTINEL
    assert len(calls) == 1


@pytest.mark.parametrize(("endpoint", "package", "fn_name", "payload", "key"), CASES, ids=IDS)
def test_gemini_failure_falls_back_to_heuristics(
    client, live_gemini, monkeypatch, endpoint, package, fn_name, payload, key
):
    calls = stub_gemini(monkeypatch, package, fn_name, None)
    response = client.post(endpoint, json=payload)
    assert response.status_code == 200
    assert key in response.json()
    assert len(calls) == 1


@pytest.mark.parametrize(("endpoint", "package", "fn_name", "payload", "key"), CASES, ids=IDS)
def test_gemini_is_not_called_in_fake_mode_even_with_a_key(
    client, monkeypatch, endpoint, package, fn_name, payload, key
):
    monkeypatch.setenv("FAKE_MODE", "true")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(app_main, "FAKE_MODE", True)
    calls = stub_gemini(monkeypatch, package, fn_name, SENTINEL)
    response = client.post(endpoint, json=payload)
    assert response.status_code == 200
    assert key in response.json()
    assert calls == []


def test_roommates_without_candidates_skips_gemini(client, live_gemini, monkeypatch):
    calls = stub_gemini(monkeypatch, "roommates", "rank_roommates_with_gemini", SENTINEL)
    response = client.post("/roommates", json={"requester": {}, "candidates": []})
    assert response.status_code == 200
    assert response.json() == {"results": []}
    assert calls == []


def test_areas_without_areas_skips_gemini(client, live_gemini, monkeypatch):
    calls = stub_gemini(monkeypatch, "areas", "recommend_areas_with_gemini", SENTINEL)
    response = client.post("/areas", json={"preferences": {}, "areas": []})
    assert response.status_code == 200
    assert response.json() == {"results": []}
    assert calls == []


def test_chat_passes_message_history_and_listing_to_gemini(client, live_gemini, monkeypatch):
    calls = stub_gemini(monkeypatch, "chat", "chat_with_gemini", SENTINEL)
    history = [{"role": "user", "content": "hi"}]
    listing = {"title": "Phòng A"}
    client.post("/chat", json={"message": "m", "history": history, "listing": listing})
    assert calls == [("m", history, listing)]


def test_chat_defaults_history_to_empty_list(client, live_gemini, monkeypatch):
    calls = stub_gemini(monkeypatch, "chat", "chat_with_gemini", SENTINEL)
    client.post("/chat", json={"message": "m"})
    assert calls == [("m", [], None)]


def test_chat_treats_explicit_null_history_as_empty(client, live_gemini, monkeypatch):
    calls = stub_gemini(monkeypatch, "chat", "chat_with_gemini", SENTINEL)
    client.post("/chat", json={"message": "m", "history": None})
    assert calls == [("m", [], None)]


def test_description_sends_the_whole_request_to_gemini(client, live_gemini, monkeypatch):
    calls = stub_gemini(monkeypatch, "description", "generate_description_with_gemini", SENTINEL)
    client.post("/description", json={"title": "T", "price": 5, "ghost_field": 1})
    sent = calls[0][0]
    assert sent["title"] == "T"
    assert sent["price"] == 5
    assert "ghost_field" not in sent  # unknown fields are dropped by the request model
