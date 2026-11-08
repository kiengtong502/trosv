import { Sparkles } from "lucide-react";
import { HOBBY_GROUPS, HOBBY_MAP } from "@/constants/hobbies";
import { cn } from "@/lib/utils";
import { HOBBY_ICONS } from "./hobbyIcons";
import { hasKey } from "./hobbySelection";

/** The preset hobbies as toggle chips, grouped by category. */
export function HobbyGroups({
  selectedKeys,
  disabled,
  onToggle,
}: {
  selectedKeys: readonly string[];
  disabled: boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <>
      {HOBBY_GROUPS.map((group) => (
        <div key={group.key} role="group" aria-label={group.label}>
          <p aria-hidden className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.hobbies.map((key) => {
              const hobby = HOBBY_MAP[key];
              if (!hobby) return null;
              const on = hasKey(selectedKeys, key);
              const Icon = HOBBY_ICONS[key] ?? Sparkles;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  aria-pressed={on}
                  onClick={() => {
                    onToggle(key);
                  }}
                  className={cn(
                    "motion-press inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    on
                      ? "border-plate bg-plate text-white"
                      : "border-line bg-card text-ink-2 hover:border-line-strong hover:bg-tint",
                  )}
                >
                  <Icon className="size-4 flex-none" aria-hidden />
                  <span>{hobby.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
