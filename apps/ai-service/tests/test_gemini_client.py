"""Shared Gemini client: key handling, model fallback order, knowledge base."""

from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest

from app.shared import gemini_client
from app.shared.gemini_client import (
    DEFAULT_MODEL,
    generate_with_fallback,
    get_api_key,
    get_client,
    is_gemini_enabled,
    load_knowledge_base,
)


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for name in ("GEMINI_API_KEY", "LLM_API_KEY", "GEMINI_MODEL", "FAKE_MODE"):
        monkeypatch.delenv(name, raising=False)


# ---------------------------------------------------------------- api key / enabled


def test_get_api_key_none_when_unset():
    assert get_api_key() is None


def test_get_api_key_prefers_gemini_over_llm(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "gem")
    monkeypatch.setenv("LLM_API_KEY", "llm")
    assert get_api_key() == "gem"


def test_get_api_key_falls_back_to_llm_key(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "llm")
    assert get_api_key() == "llm"


def test_get_api_key_treats_empty_string_as_unset(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    assert get_api_key() is None


@pytest.mark.parametrize(
    ("fake_mode", "key", "expected"),
    [
        (None, "k", False),  # FAKE_MODE defaults to true
        ("true", "k", False),
        ("TRUE", "k", False),
        ("false", None, False),
        ("false", "k", True),
    ],
)
def test_is_gemini_enabled(monkeypatch, fake_mode, key, expected):
    if fake_mode is not None:
        monkeypatch.setenv("FAKE_MODE", fake_mode)
    if key is not None:
        monkeypatch.setenv("GEMINI_API_KEY", key)
    assert is_gemini_enabled() is expected


# ---------------------------------------------------------------- get_client


def test_get_client_returns_none_without_key():
    assert get_client() is None


def test_get_client_builds_client_with_key(monkeypatch):
    seen: dict[str, Any] = {}

    class FakeClient:
        def __init__(self, api_key: str) -> None:
            seen["api_key"] = api_key

    monkeypatch.setenv("GEMINI_API_KEY", "secret")
    monkeypatch.setattr(gemini_client.genai, "Client", FakeClient)
    assert isinstance(get_client(), FakeClient)
    assert seen == {"api_key": "secret"}


def test_get_client_swallows_constructor_errors(monkeypatch):
    def boom(api_key: str) -> None:
        raise RuntimeError(api_key)

    monkeypatch.setenv("GEMINI_API_KEY", "secret")
    monkeypatch.setattr(gemini_client.genai, "Client", boom)
    assert get_client() is None


# ---------------------------------------------------------------- generate_with_fallback


class FakeModels:
    """Records which models were tried; `plan` maps model name -> text | Exception | None."""

    def __init__(self, plan: dict[str, Any]) -> None:
        self.plan = plan
        self.tried: list[str] = []
        self.requests: list[tuple[Any, Any]] = []

    def generate_content(self, *, model: str, contents: Any, config: Any) -> Any:
        self.tried.append(model)
        self.requests.append((contents, config))
        outcome = self.plan.get(model)
        if isinstance(outcome, Exception):
            raise outcome
        return None if outcome is None else SimpleNamespace(text=outcome)


def make_client(plan: dict[str, Any]) -> tuple[Any, FakeModels]:
    models = FakeModels(plan)
    return SimpleNamespace(models=models), models


def run(client: Any) -> str | None:
    return generate_with_fallback(client, "prompt", config=None)  # type: ignore[arg-type]


def test_first_model_success_stops_immediately():
    client, models = make_client({DEFAULT_MODEL: "ok"})
    assert run(client) == "ok"
    assert models.tried == [DEFAULT_MODEL]
    assert models.requests == [("prompt", None)]  # prompt and config are passed through


def test_falls_back_to_next_model_after_error():
    client, models = make_client({DEFAULT_MODEL: RuntimeError("503"), "gemini-3.5-flash": "ok"})
    assert run(client) == "ok"
    assert models.tried == [DEFAULT_MODEL, "gemini-3.5-flash"]


def test_empty_text_counts_as_failure_and_falls_back():
    client, models = make_client({DEFAULT_MODEL: "", "gemini-3.5-flash": "ok"})
    assert run(client) == "ok"
    assert models.tried == [DEFAULT_MODEL, "gemini-3.5-flash"]


def test_none_response_counts_as_failure():
    client, models = make_client({DEFAULT_MODEL: None, "gemini-3.5-flash": "ok"})
    assert run(client) == "ok"
    assert models.tried == [DEFAULT_MODEL, "gemini-3.5-flash"]


def test_all_models_failing_returns_none():
    client, models = make_client(
        {DEFAULT_MODEL: RuntimeError("a"), "gemini-3.5-flash": RuntimeError("b")}
    )
    assert run(client) is None
    assert models.tried == [DEFAULT_MODEL, "gemini-3.5-flash"]


def test_configured_model_is_tried_first_then_defaults(monkeypatch):
    monkeypatch.setenv("GEMINI_MODEL", "custom-model")
    client, models = make_client({"custom-model": RuntimeError("gone")})
    assert run(client) is None
    assert models.tried == ["custom-model", DEFAULT_MODEL, "gemini-3.5-flash"]


def test_duplicate_models_are_tried_once(monkeypatch):
    monkeypatch.setenv("GEMINI_MODEL", "gemini-3.5-flash")
    client, models = make_client({})
    assert run(client) is None
    assert models.tried == ["gemini-3.5-flash", DEFAULT_MODEL]


# ---------------------------------------------------------------- knowledge base


def test_knowledge_base_loads_repo_file():
    text = load_knowledge_base()
    assert text.strip()
    assert text == (Path(gemini_client.__file__).parents[2] / "knowledge.md").read_text("utf-8")


def test_knowledge_base_unreadable_file_returns_empty(monkeypatch):
    def unreadable(self: Path, *args: Any, **kwargs: Any) -> str:
        raise OSError(str(self))

    monkeypatch.setattr(Path, "read_text", unreadable)
    assert load_knowledge_base() == ""


def test_knowledge_base_missing_files_return_empty(monkeypatch):
    monkeypatch.setattr(Path, "exists", lambda _self: False)
    assert load_knowledge_base() == ""
