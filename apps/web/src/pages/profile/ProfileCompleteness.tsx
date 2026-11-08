/** "Hồ sơ 78%" with what is still missing and a progress bar. */
export function ProfileCompleteness({ percent, missing }: { percent: number; missing: string[] }) {
  return (
    <div data-testid="profile-completeness" className="mb-5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">Hồ sơ {percent}%</span>
        {missing.length > 0 ? (
          <span className="truncate text-muted">
            Còn thiếu: {missing.slice(0, 3).join(", ")}
            {missing.length > 3 ? "…" : ""}
          </span>
        ) : (
          <span className="text-moss">Đã đầy đủ</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Mức hoàn thiện hồ sơ"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-tint"
      >
        <div
          className="h-full rounded-full bg-moss transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
