import { X } from "lucide-react";
import type { FilterChip } from "../lib/filterChips";

/** "Đang lọc theo:" row of removable chips; renders nothing when no filter is active. */
export function ActiveChips({ chips }: { chips: FilterChip[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-2 border-t border-line/60">
      <span className="text-xs text-muted">Đang lọc theo:</span>
      {chips.map((c) => (
        <span
          key={c.key}
          className={
            "inline-flex items-center gap-1 rounded-full border border-plate/30 " +
            "bg-card px-2.5 py-0.5 text-xs font-medium text-plate shadow-2xs"
          }
        >
          <span>{c.label}</span>
          <button
            type="button"
            onClick={c.onRemove}
            aria-label={`Bỏ lọc ${c.label}`}
            className={
              "flex size-4 items-center justify-center rounded-full text-muted " +
              "hover:text-ink hover:bg-line"
            }
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}
