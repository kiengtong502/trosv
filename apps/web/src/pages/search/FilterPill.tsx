import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { cn } from "@/lib/utils";

export interface FilterPillProps {
  label: string;
  active: boolean;
  onClear: () => void;
  children: ReactNode;
}

/** A pill in the filter strip that opens a popover; yellow while its filter is active. */
export function FilterPill({ label, active, onClear, children }: FilterPillProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "h-10 flex-none rounded-lg border px-3.5 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate",
            active
              ? "border-flyer bg-flyer font-semibold text-flyer-ink"
              : "border-white/30 bg-white/10 text-white hover:bg-white/20",
          )}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        {children}
        {active ? (
          <button
            type="button"
            onClick={onClear}
            className="mt-3 text-sm font-medium text-muted underline hover:text-ink"
          >
            Xóa lọc này
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
