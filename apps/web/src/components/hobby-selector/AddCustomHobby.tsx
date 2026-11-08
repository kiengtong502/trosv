import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const CUSTOM_MAX_LENGTH = 30;

/** "+ Khác" chip that turns into a small form for typing a custom hobby. */
export function AddCustomHobby({ onAdd }: { onAdd: (typed: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const close = () => {
    setAdding(false);
    setInput("");
  };
  const submit = () => {
    const typed = input.trim();
    setInput("");
    if (typed) onAdd(typed);
  };

  if (!adding) {
    return (
      <button
        type="button"
        aria-label="Thêm sở thích khác"
        onClick={() => {
          setAdding(true);
        }}
        className={cn(
          "motion-press inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-line-strong px-3.5 text-sm font-medium text-ink-2 transition-colors",
          "hover:border-plate hover:text-plate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate",
        )}
      >
        <Plus className="size-4" aria-hidden />
        Khác
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={input}
        maxLength={CUSTOM_MAX_LENGTH}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            close();
          }
        }}
        aria-label="Sở thích khác"
        placeholder="Ví dụ: Yoga, Guitar..."
        className="h-11 w-56 max-w-full rounded-lg border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-muted focus:border-plate focus:outline-none focus:ring-1 focus:ring-plate"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!input.trim()}
        className="inline-flex h-11 items-center gap-1 rounded-lg bg-ink px-4 text-sm font-medium text-card transition-colors hover:bg-ink-2 disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden />
        Thêm
      </button>
      <button
        type="button"
        onClick={close}
        className="h-11 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-tint hover:text-ink"
      >
        Xong
      </button>
    </div>
  );
}
