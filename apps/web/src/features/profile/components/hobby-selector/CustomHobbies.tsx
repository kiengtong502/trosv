import { Sparkles, X } from "lucide-react";
import type { HobbyItem } from "@/features/profile/lib/hobbies";

/** The user's own hobbies, each removable (unless the picker is disabled). */
export function CustomHobbies({
  hobbies,
  disabled,
  onRemove,
}: {
  hobbies: HobbyItem[];
  disabled: boolean;
  onRemove: (key: string) => void;
}) {
  if (hobbies.length === 0) return null;
  return (
    <div role="group" aria-label="Sở thích riêng">
      <p aria-hidden className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Sở thích riêng
      </p>
      <div className="flex flex-wrap gap-2">
        {hobbies.map((hobby) => (
          <span
            key={hobby.key}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-plate bg-plate px-3.5 text-sm font-medium text-white"
          >
            <Sparkles className="size-4 flex-none" aria-hidden />
            <span>{hobby.label}</span>
            {!disabled ? (
              <button
                type="button"
                onClick={() => {
                  onRemove(hobby.key);
                }}
                aria-label={`Xóa ${hobby.label}`}
                className="-mr-1.5 flex size-7 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
