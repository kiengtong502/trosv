import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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

  /** First / previous / next / last: icon-only, so the label doubles as the tooltip. */
  const navButton = (label: string, Icon: LucideIcon, target: number, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => {
        onPage(target);
      }}
      className="grid size-8 place-items-center rounded-lg border border-line-strong bg-card text-ink hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate disabled:cursor-not-allowed disabled:opacity-40 sm:size-9"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );

  return (
    <nav
      aria-label="Phân trang kết quả tìm phòng"
      className="mt-8 flex flex-wrap items-center justify-center gap-0.5 sm:gap-1.5"
    >
      {navButton("Trang đầu", ChevronsLeft, 1, page <= 1)}
      {navButton("Trang trước", ChevronLeft, page - 1, page <= 1)}
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
      {navButton("Trang sau", ChevronRight, page + 1, page >= lastPage)}
      {navButton("Trang cuối", ChevronsRight, lastPage, page >= lastPage)}
    </nav>
  );
}
