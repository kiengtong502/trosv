import { cn } from "@/shared/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { paginationWindow } from "../lib/filterChips";

const NAVIGATION_BUTTON_CLASS =
  "grid size-8 sm:size-9 place-items-center rounded-lg border border-line-strong bg-card text-ink hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate disabled:cursor-not-allowed disabled:opacity-40";

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
    <nav
      aria-label="Phân trang kết quả tìm phòng"
      className="mt-8 flex flex-wrap items-center justify-center gap-0.5 sm:gap-1.5"
    >
      <button
        type="button"
        aria-label="Trang đầu"
        title="Trang đầu"
        disabled={page <= 1}
        onClick={() => {
          onPage(1);
        }}
        className={NAVIGATION_BUTTON_CLASS}
      >
        <ChevronsLeft className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Trang trước"
        disabled={page <= 1}
        onClick={() => {
          onPage(page - 1);
        }}
        className={NAVIGATION_BUTTON_CLASS}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      {paginationWindow(page, lastPage).map((p) => (
        <button
          key={p}
          type="button"
          aria-label={`Trang ${p}`}
          onClick={() => {
            onPage(p);
          }}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "motion-press size-8 rounded-lg text-sm font-semibold tabular-nums transition-colors sm:size-9",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate",
            p === page
              ? "bg-plate text-white"
              : "border border-line-strong bg-card text-ink hover:bg-tint",
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        aria-label="Trang sau"
        disabled={page >= lastPage}
        onClick={() => {
          onPage(page + 1);
        }}
        className={NAVIGATION_BUTTON_CLASS}
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Trang cuối"
        title="Trang cuối"
        disabled={page >= lastPage}
        onClick={() => {
          onPage(lastPage);
        }}
        className={NAVIGATION_BUTTON_CLASS}
      >
        <ChevronsRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
