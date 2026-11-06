import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Camera,
  ChefHat,
  Clapperboard,
  Code,
  Coffee,
  Dumbbell,
  Feather,
  Gamepad2,
  Goal,
  GraduationCap,
  Music,
  Palette,
  PawPrint,
  Plane,
  Plus,
  BookOpen,
  Sparkles,
  X,
} from "lucide-react";
import {
  HOBBY_GROUPS,
  HOBBY_LIST,
  HOBBY_MAP,
  HOBBY_PICK_MAX,
  HOBBY_PICK_MIN,
  parseHobbies,
} from "@/constants/hobbies";
import { cn } from "@/lib/utils";

/*
  Hobby picker. Chips are grouped by category, one icon each (a single
  consistent set), at least 44px tall. A hint says how many to pick and why;
  a meter shows when there is enough for the AI roommate matcher. Custom
  hobbies live behind a "+ Khác" chip. `value` stays a comma-separated string.
*/

const ICONS: Record<string, LucideIcon> = {
  music: Music,
  gym: Dumbbell,
  reading: BookOpen,
  gaming: Gamepad2,
  cooking: ChefHat,
  photography: Camera,
  football: Goal,
  studying: GraduationCap,
  movies: Clapperboard,
  travel: Plane,
  badminton: Feather,
  "cafés": Coffee,
  coding: Code,
  art: Palette,
  pets: PawPrint,
};

const CUSTOM_MAX_LENGTH = 30;

export interface HobbySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

function statusText(count: number): string {
  if (count < HOBBY_PICK_MIN) return `Chọn thêm ${HOBBY_PICK_MIN - count} sở thích nữa`;
  if (count <= HOBBY_PICK_MAX) return "Vậy là đủ để AI ghép bạn cùng phòng";
  return "Bạn có nhiều sở thích, AI sẽ ưu tiên những điểm chung";
}

export function HobbySelector({
  value,
  onChange,
  className,
  disabled = false,
}: HobbySelectorProps) {
  const [adding, setAdding] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const selected = parseHobbies(value);
  const selectedKeys = new Set(selected.map((h) => h.key.toLowerCase()));
  const count = selected.length;
  const standardKeys = new Set(HOBBY_LIST.map((h) => h.key.toLowerCase()));
  const customHobbies = selected.filter((h) => !standardKeys.has(h.key.toLowerCase()));

  const update = (keys: string[]) => {
    const unique = Array.from(new Set(keys.map((k) => k.trim()))).filter(Boolean);
    onChange(unique.join(","));
  };
  const keys = () => selected.map((h) => h.key);
  const remove = (key: string) => {
    update(keys().filter((k) => k.toLowerCase() !== key.toLowerCase()));
  };
  const toggle = (key: string) => {
    if (disabled) return;
    if (selectedKeys.has(key.toLowerCase())) remove(key);
    else update([...keys(), key]);
  };

  const addCustom = () => {
    const typed = customInput.trim();
    setCustomInput("");
    if (!typed || disabled) return;
    const lower = typed.toLowerCase();
    // Typing an existing hobby's name selects that hobby instead of duplicating it.
    const standard = HOBBY_LIST.find(
      (h) => h.key.toLowerCase() === lower || h.label.toLowerCase() === lower
    );
    if (standard) {
      if (!selectedKeys.has(standard.key.toLowerCase())) update([...keys(), standard.key]);
      return;
    }
    if (!selectedKeys.has(lower)) update([...keys(), typed]);
  };

  const closeAdding = () => {
    setAdding(false);
    setCustomInput("");
  };

  const pct = Math.min(count / HOBBY_PICK_MIN, 1) * 100;
  const enough = count >= HOBBY_PICK_MIN;

  return (
    <div data-testid="hobby-picker" className={cn("space-y-5", className)}>
      <div>
        <p className="text-sm font-medium text-ink">
          Chọn {HOBBY_PICK_MIN}–{HOBBY_PICK_MAX} sở thích để AI ghép chính xác hơn
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Mức đủ thông tin cho AI"
            aria-valuemin={0}
            aria-valuemax={HOBBY_PICK_MIN}
            aria-valuenow={Math.min(count, HOBBY_PICK_MIN)}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-tint"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width,background-color] duration-300",
                enough ? "bg-moss" : "bg-plate"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="flex-none text-xs text-muted">
            Đã chọn: <strong data-testid="hobby-count" className="font-semibold text-ink">{count}</strong>
          </p>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p
            data-testid="hobby-hint"
            aria-live="polite"
            className={cn("flex items-center gap-1.5 text-xs", enough ? "text-moss" : "text-muted")}
          >
            {enough ? <Sparkles className="size-3.5" aria-hidden /> : null}
            {statusText(count)}
          </p>
          {count > 0 && !disabled ? (
            <button
              type="button"
              onClick={() => { onChange(""); }}
              className="text-xs text-muted underline-offset-2 transition-colors hover:text-danger hover:underline"
            >
              Bỏ chọn tất cả
            </button>
          ) : null}
        </div>
      </div>

      {HOBBY_GROUPS.map((group) => (
        <div key={group.key} role="group" aria-label={group.label}>
          <p aria-hidden className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.hobbies.map((key) => {
              const hobby = HOBBY_MAP[key];
              if (!hobby) return null;
              const on = selectedKeys.has(key.toLowerCase());
              const Icon = ICONS[key] ?? Sparkles;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  aria-pressed={on}
                  onClick={() => { toggle(key); }}
                  className={cn(
                    "motion-press inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    on
                      ? "border-plate bg-plate text-white"
                      : "border-line bg-card text-ink-2 hover:border-line-strong hover:bg-tint"
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

      {customHobbies.length > 0 ? (
        <div role="group" aria-label="Sở thích riêng">
          <p aria-hidden className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Sở thích riêng
          </p>
          <div className="flex flex-wrap gap-2">
            {customHobbies.map((hobby) => (
              <span
                key={hobby.key}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-plate bg-plate px-3.5 text-sm font-medium text-white"
              >
                <Sparkles className="size-4 flex-none" aria-hidden />
                <span>{hobby.label}</span>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => { remove(hobby.key); }}
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
      ) : null}

      {!disabled ? (
        adding ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={customInput}
              maxLength={CUSTOM_MAX_LENGTH}
              onChange={(e) => { setCustomInput(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  closeAdding();
                }
              }}
              aria-label="Sở thích khác"
              placeholder="Ví dụ: Yoga, Guitar..."
              className="h-11 w-56 max-w-full rounded-lg border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-muted focus:border-plate focus:outline-none focus:ring-1 focus:ring-plate"
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!customInput.trim()}
              className="inline-flex h-11 items-center gap-1 rounded-lg bg-ink px-4 text-sm font-medium text-card transition-colors hover:bg-ink-2 disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden />
              Thêm
            </button>
            <button
              type="button"
              onClick={closeAdding}
              className="h-11 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-tint hover:text-ink"
            >
              Xong
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Thêm sở thích khác"
            onClick={() => { setAdding(true); }}
            className={cn(
              "motion-press inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-line-strong px-3.5 text-sm font-medium text-ink-2 transition-colors",
              "hover:border-plate hover:text-plate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
            )}
          >
            <Plus className="size-4" aria-hidden />
            Khác
          </button>
        )
      ) : null}
    </div>
  );
}
