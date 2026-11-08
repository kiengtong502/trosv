import { Sparkles } from "lucide-react";
import { HOBBY_PICK_MAX, HOBBY_PICK_MIN } from "@/constants/hobbies";
import { cn } from "@/lib/utils";
import { meterPercent, statusText } from "./hobbySelection";

/** How many to pick and why, a progress meter, the count, and "clear all". */
export function HobbyMeter({
  count,
  canClear,
  onClear,
}: {
  count: number;
  canClear: boolean;
  onClear: () => void;
}) {
  const enough = count >= HOBBY_PICK_MIN;
  return (
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
              enough ? "bg-moss" : "bg-plate",
            )}
            style={{ width: `${meterPercent(count)}%` }}
          />
        </div>
        <p className="flex-none text-xs text-muted">
          Đã chọn:{" "}
          <strong data-testid="hobby-count" className="font-semibold text-ink">
            {count}
          </strong>
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
        {canClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted underline-offset-2 transition-colors hover:text-danger hover:underline"
          >
            Bỏ chọn tất cả
          </button>
        ) : null}
      </div>
    </div>
  );
}
