from typing import Any


def int_or(value: Any, default: int) -> int:
    """Ep gia tri bat ky ve int an toan (null/str/None -> default)."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
