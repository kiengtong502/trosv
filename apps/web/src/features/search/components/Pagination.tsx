import { cn } from "@/shared/lib/utils";
import { paginationWindow } from "../lib/filterChips";

/** Up to 5 page buttons around the current page; hidden when there is one page. */
export function Pagination({
  page,
  lastPage,
  onPage,
}: {
  page: number;
  lastPage: number;
  onPage: (page: number) => void;
}) {
  if (lastPage <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      {paginationWindow(page, lastPage).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => {
            onPage(p);
          }}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "motion-press size-9 rounded-lg text-sm font-semibold tabular-nums transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate",
            p === page
              ? "bg-plate text-white"
              : "border border-line-strong bg-card text-ink hover:bg-tint",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
