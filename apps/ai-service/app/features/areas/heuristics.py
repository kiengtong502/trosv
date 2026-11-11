from typing import Any

from app.features.areas.schemas import AreasReq
from app.shared.parsing import int_or


def _budget_bonus(avg: int, budget_min: int, budget_max: int) -> int:
    """Diem cong/tru theo do phu hop cua gia trung binh voi ngan sach."""
    if not (budget_min and budget_max):
        return 0
    if budget_min <= avg <= budget_max:
        return 20
    return -10 if avg > budget_max else 0


def _priority_bonus(area: dict[str, Any], priorities: set[str], avg: int, budget_max: int) -> int:
    """Diem cong theo tung uu tien (cheap/near_school/well_rated/many_options)."""
    weights = {"cheap": 15, "near_school": 15, "well_rated": 10, "many_options": 10}
    dist = area.get("distance_to_school_km")
    rating = area.get("avg_rating")
    rules = (
        ("cheap", bool(avg) and avg <= budget_max),
        ("near_school", dist is not None and dist <= 3),
        ("well_rated", rating is not None and bool(rating) and float(rating) >= 4),
        ("many_options", int_or(area.get("listings_count"), 0) >= 20),
    )
    return sum(weights[name] for name, hit in rules if name in priorities and hit)


def _describe_area(area: dict[str, Any], avg: int) -> str:
    """Mo ta mot dong tieng Viet ve khu vuc cho truong `reason`."""
    bits = [f"Gia trung binh {avg:,}" if avg else "Chua co du lieu gia"]
    if area.get("avg_rating"):
        bits.append(f"diem trung binh {area['avg_rating']}")
    if area.get("distance_to_school_km") is not None:
        bits.append(f"cach truong {area['distance_to_school_km']} km")
    bits.append(f"{area.get('listings_count', 0)} tin dang")
    return ("; ".join(bits) + ".").capitalize()


def recommend_areas(req: AreasReq) -> dict[str, Any]:
    """Heuristic area recommendations."""
    prefs = req.preferences
    budget_max = int_or(prefs.get("budget_max"), 0)
    budget_min = int_or(prefs.get("budget_min"), 0)
    priorities = set(prefs.get("priorities") or [])

    def score(area: dict[str, Any]) -> tuple[int, str]:
        avg = int_or(area.get("avg_price"), 0)
        s = 50
        s += _budget_bonus(avg, budget_min, budget_max)
        s += _priority_bonus(area, priorities, avg, budget_max)
        return min(s, 100), _describe_area(area, avg)

    ranked = sorted(
        ((score(a), a["ward_id"]) for a in (req.areas or [])),
        key=lambda p: (-p[0][0], p[1]),
    )
    return {
        "results": [
            {"ward_id": wid, "reason": why} for (sc, why), wid in ranked[: max(1, req.limit)]
        ]
    }
