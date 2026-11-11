import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/ui/button";
import type { AiAreaSuggestion } from "@/shared/types/api";
import { listingsCountLine, statsLine } from "../lib/areaStats";

/** One suggested area: why, the numbers, and a link to its rooms. */
export function SuggestionCard({ area }: { area: AiAreaSuggestion }) {
  return (
    <div className="rounded-xl border border-line bg-card p-5 shadow-xs hover:border-line-strong transition-colors">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-ink">{area.name}</h2>
        <p className="tabular-nums text-sm text-muted">{statsLine(area.stats)}</p>
      </div>
      <p className="mt-2 text-sm text-ink-2 leading-relaxed">{area.reason ?? ""}</p>
      <p className="mt-2 text-xs text-muted tabular-nums">{listingsCountLine(area.stats)}</p>
      <div className="mt-3 flex justify-end">
        <Button asChild size="sm" variant="primary">
          <Link to={`${ROUTES.ROOMS}?ward_id=${area.ward_id ?? ""}`}>Xem phòng khu vực này</Link>
        </Button>
      </div>
    </div>
  );
}
