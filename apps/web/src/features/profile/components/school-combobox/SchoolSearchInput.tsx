import type { RefObject } from "react";
import { ChevronsUpDown, Search, X } from "lucide-react";

/** The open state's text box, with a clear-text button while there is text. */
export function SchoolSearchInput({
  inputRef,
  query,
  onQueryChange,
}: {
  inputRef: RefObject<HTMLInputElement>;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <div className="flex h-11 w-full items-center justify-between rounded-lg border bg-card px-3 text-sm transition border-plate ring-2 ring-plate/20">
      <div className="flex items-center gap-2 text-ink-2 min-w-0 flex-1">
        <Search className="size-4 text-muted shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
          }}
          placeholder="Gõ tên trường hoặc viết tắt (VD: Bách Khoa, UET, UEH...)"
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {query ? (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
            className="p-1 text-muted hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
        <ChevronsUpDown className="size-4 text-muted" aria-hidden />
      </div>
    </div>
  );
}
