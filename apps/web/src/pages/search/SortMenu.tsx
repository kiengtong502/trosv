import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, sortLabel } from "./filterChips";

/** "Sắp xếp: Mới nhất ▾" dropdown. */
export function SortMenu({ sort, onChange }: { sort: string; onChange: (sort: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted hidden sm:inline">Sắp xếp:</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={
              "inline-flex items-center gap-1 rounded-md border border-line bg-card " +
              "px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs hover:bg-tint " +
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
            }
          >
            <span>{sortLabel(sort)}</span>
            <ChevronDown className="size-3.5 text-muted" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-44 p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
              }}
              className={cn(
                "w-full rounded px-2.5 py-1.5 text-left text-xs transition-colors",
                sort === opt.value
                  ? "bg-plate-tint font-bold text-plate"
                  : "text-ink hover:bg-tint",
              )}
            >
              {opt.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
