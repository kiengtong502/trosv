import { ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/** The closed, empty state: a button that opens the picker. */
export function SchoolTrigger({ hasError, onOpen }: { hasError: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-lg border bg-card px-3 text-sm transition",
        "text-left cursor-pointer",
        hasError ? "border-danger ring-1 ring-danger" : "border-line-strong hover:border-plate",
      )}
    >
      <div className="flex items-center gap-2 text-ink-2 min-w-0 flex-1">
        <Search className="size-4 text-muted shrink-0" aria-hidden />
        <span className="text-muted truncate">
          Tìm theo tên trường hoặc viết tắt (VD: Bách Khoa, UET...)
        </span>
      </div>
      <ChevronsUpDown className="size-4 text-muted shrink-0 ml-2" aria-hidden />
    </button>
  );
}
