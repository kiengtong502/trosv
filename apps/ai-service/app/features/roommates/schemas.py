from typing import Any

from pydantic import Field

from app.shared.schemas import BaseReq


class RoommatesReq(BaseReq):
    """POST /roommates - requester + candidate profiles de xep hang."""

    requester: dict[str, Any]
    candidates: list[dict[str, Any]] | None = Field(default=[])
    limit: int = 5
