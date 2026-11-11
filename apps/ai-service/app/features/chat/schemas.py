from typing import Any

from pydantic import Field

from app.shared.schemas import BaseReq


class ChatReq(BaseReq):
    """POST /chat - cau hoi + lich su hoi thoai + ngu canh tin dang."""

    message: str
    history: list[dict[str, Any]] | None = Field(default=[])
    listing: dict[str, Any] | None = None
