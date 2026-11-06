import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  One collapsible block of the profile. Closed, it shows a one-line summary so
  the page stays calm; open, it shows the fields. Children stay mounted while
  closed (hidden), so form state and field ids survive.
*/
export function ProfileSection({
  id,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  summary?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-card shadow-card">
      <h2>
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className={cn(
            "flex min-h-16 w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left transition-colors",
            "hover:bg-tint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
          )}
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold text-ink">{title}</span>
            {!open && summary ? (
              <span className="mt-0.5 block truncate font-sans text-sm font-normal text-muted">
                {summary}
              </span>
            ) : null}
          </span>
          <ChevronDown
            aria-hidden
            className={cn("size-5 flex-none text-muted transition-transform duration-200", open && "rotate-180")}
          />
        </button>
      </h2>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        hidden={!open}
        className="border-t border-line px-5 py-5"
      >
        {children}
      </div>
    </section>
  );
}
