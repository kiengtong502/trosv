from typing import Any

from app.features.roommates.schemas import RoommatesReq


def _shared_interests(a: dict[str, Any], b: dict[str, Any]) -> list[str]:
    """So huu tinh chung giua hai ho so (khong phan biet hoa/thuong)."""
    sa = {str(x).lower() for x in (a.get("interests") or [])}
    sb = {str(x).lower() for x in (b.get("interests") or [])}
    return sorted(sa & sb)


def _score_candidate(req: RoommatesReq, cand: dict[str, Any]) -> tuple[int, str]:
    """Diem tuong thich 0-100 + ly do tieng Viet cho mot ung vien."""
    r = req.requester
    shared = _shared_interests(r, cand)
    overlap = max(
        0,
        min(r.get("budget_max", 0), cand.get("budget_max", 0))
        - max(r.get("budget_min", 0), cand.get("budget_min", 0)),
    )
    score = (
        40
        + 12 * len(shared)
        + (20 if overlap > 0 else 0)
        + (8 if r.get("cleanliness") == cand.get("cleanliness") else 0)
        + (8 if r.get("smoking") == cand.get("smoking") else 0)
    )
    bits = []
    if shared:
        bits.append("Cung thich " + ", ".join(shared))
    bits.append("ngan sach giao nhau" if overlap > 0 else "ngan sach lech nhau")
    if r.get("personality") == cand.get("personality"):
        bits.append("tinh cach tuong dong")
    reason: str = (", ".join(bits) + ".").capitalize()
    return min(score, 100), reason


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
