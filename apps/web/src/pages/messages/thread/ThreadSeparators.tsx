export function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-2">
      <span
        data-testid="day-separator"
        className="rounded-full bg-tint px-3 py-0.5 text-[11.5px] font-semibold tracking-wide text-muted"
      >
        {label}
      </span>
    </div>
  );
}

export function TimeSeparator({ date }: { date: string }) {
  const time = new Date(date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-center justify-center py-2 my-1" aria-hidden={false}>
      <span className="rounded-full bg-sunken/60 px-2.5 py-0.5 text-[11px] font-medium text-muted">
        {time}
      </span>
    </div>
  );
}
