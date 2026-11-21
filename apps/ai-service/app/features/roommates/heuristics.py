from typing import Any

from app.features.roommates.schemas import RoommatesReq
from app.shared.parsing import int_or
from app.shared.text import vnd

SLEEP_LABELS = {"early": "ngủ sớm", "normal": "ngủ bình thường", "late": "hay thức khuya"}
PERSONALITY_LABELS = {"introvert": "hướng nội", "ambivert": "cân bằng", "extrovert": "hướng ngoại"}


def _shared_interests(a: dict[str, Any], b: dict[str, Any]) -> list[str]:
    """So huu tinh chung giua hai ho so (khong phan biet hoa/thuong)."""
    sa = {str(x).lower() for x in (a.get("interests") or [])}
    sb = {str(x).lower() for x in (b.get("interests") or [])}
    return sorted(sa & sb)


def _budget_overlap(a: dict[str, Any], b: dict[str, Any]) -> int:
    return max(
        0,
        min(int_or(a.get("budget_max"), 0), int_or(b.get("budget_max"), 0))
        - max(int_or(a.get("budget_min"), 0), int_or(b.get("budget_min"), 0)),
    )


def _same(a: dict[str, Any], b: dict[str, Any], key: str) -> bool:
    return a.get(key) is not None and a.get(key) == b.get(key)


def _close_cleanliness(a: dict[str, Any], b: dict[str, Any]) -> bool:
    ca, cb = a.get("cleanliness"), b.get("cleanliness")
    return ca is not None and cb is not None and abs(int_or(ca, 0) - int_or(cb, 0)) <= 1


def _score_candidate(req: RoommatesReq, cand: dict[str, Any]) -> tuple[int, str]:
    """Diem tuong thich 0-100 + ly do tieng Viet cho mot ung vien."""
    r = req.requester
    shared = _shared_interests(r, cand)
    overlap = _budget_overlap(r, cand)
    score = (
        40
        + 10 * min(len(shared), 3)
        + (20 if overlap > 0 else 0)
        + (8 if _same(r, cand, "sleep_schedule") else 0)
        + (8 if _close_cleanliness(r, cand) else 0)
        + (8 if _same(r, cand, "smoking") else 0)
    )
    bits = []
    if shared:
        bits.append("Cùng thích " + ", ".join(shared))
    bits.append("ngân sách giao nhau" if overlap > 0 else "ngân sách lệch nhau")
    if _same(r, cand, "sleep_schedule"):
        bits.append("cùng " + SLEEP_LABELS.get(str(r["sleep_schedule"]), "giờ giấc"))
    if _same(r, cand, "personality"):
        bits.append("tính cách tương đồng")
    reason = ", ".join(bits) + "."
    return min(score, 100), reason[0].upper() + reason[1:]


def score_roommates(req: RoommatesReq) -> dict[str, Any]:
    """Heuristic scoring for roommates."""
    scored = sorted(
        ((_score_candidate(req, c), c["id"]) for c in (req.candidates or [])),
        key=lambda pair: (-pair[0][0], pair[1]),
    )
    return {
        "results": [
            {"id": cid, "score": sc, "reason": why}
            for (sc, why), cid in scored[: max(1, req.limit)]
        ]
    }


def describe_profile(p: dict[str, Any]) -> str:
    """One readable Vietnamese line per profile for the LLM prompt."""
    smoking = p.get("smoking")
    return ", ".join(
        [
            f"ngân sách {vnd(int_or(p.get('budget_min'), 0))}-{vnd(int_or(p.get('budget_max'), 0))}",
            SLEEP_LABELS.get(str(p.get("sleep_schedule")), "giờ ngủ chưa rõ"),
            f"sạch sẽ {p['cleanliness']}/5"
            if p.get("cleanliness") is not None
            else "độ sạch sẽ chưa rõ",
            "chưa rõ hút thuốc"
            if smoking is None
            else ("có hút thuốc" if smoking else "không hút thuốc"),
            PERSONALITY_LABELS.get(str(p.get("personality")), "tính cách chưa rõ"),
            "sở thích: " + (", ".join(p.get("interests") or []) or "chưa có"),
        ]
    )
