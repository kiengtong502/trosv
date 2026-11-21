import re
import unicodedata


def fold(text: str) -> str:
    """Lowercase and strip Vietnamese diacritics so keywords match typed or untyped accents."""
    decomposed = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def has_any_word(text: str, keywords: tuple[str, ...]) -> bool:
    """True if any keyword appears as whole word(s) in the folded text ("re" never hits "tro")."""
    folded = fold(text)
    return any(re.search(rf"\b{re.escape(k)}\b", folded) for k in keywords)


def vnd(amount: int) -> str:
    """Vietnamese money format: 2500000 -> "2.500.000đ"."""
    return f"{amount:,}đ".replace(",", ".")
