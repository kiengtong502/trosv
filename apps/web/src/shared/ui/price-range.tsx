import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { formatVnd } from "@/shared/lib/format";

/*
  PriceRange: one bar with two dots instead of two number boxes. Built on two
  native range inputs laid over one track, so keyboard (arrows, Home/End, Page
  keys) and screen readers work for free. Values move in 100.000đ steps and the
  dots never get closer than one step.

  Values are strings like the rest of the filters: "" means "not set". A dot
  resting on its end of the bar means "no limit" on that side.
*/

export const PRICE_STEP = 100_000;
const LO = 0;
const HI = 10_000_000;

export interface PriceRangeProps {
  /** Lowest price as a string of digits, "" when not set. */
  min: string;
  /** Highest price as a string of digits, "" when not set. */
  max: string;
  onChange: (min: string, max: string) => void;
  id?: string;
  className?: string;
}

function clamp(n: number): number {
  return Math.min(HI, Math.max(LO, n));
}

function describe(min: string, max: string): string {
  const lo = min !== "" && Number(min) > LO;
  const hi = max !== "" && Number(max) < HI;
  if (!lo && !hi) return "Không giới hạn";
  if (lo && hi) return `${formatVnd(Number(min))} – ${formatVnd(Number(max))}`;
  if (lo) return `Từ ${formatVnd(Number(min))}`;
  return `Đến ${formatVnd(Number(max))}`;
}

export function PriceRange({ min, max, onChange, id = "price-range", className }: PriceRangeProps) {
  const minV = clamp(min === "" ? LO : Number(min));
  const maxV = clamp(max === "" ? HI : Number(max));
  const [lastMoved, setLastMoved] = useState<"min" | "max">("max");
  const pct = (v: number) => ((v - LO) / (HI - LO)) * 100;

  function setMin(raw: number): void {
    const v = Math.min(raw, maxV - PRICE_STEP);
    onChange(v <= LO ? "" : String(v), max);
  }
  function setMax(raw: number): void {
    const v = Math.max(raw, minV + PRICE_STEP);
    onChange(min, v >= HI ? "" : String(v));
  }

  // The dot sitting on top is the one you can still drag when both are bunched at an end.
  const minOnTop = lastMoved === "min" || minV >= HI - PRICE_STEP;

  return (
    <div data-testid={id} className={cn("w-full", className)}>
      <p
        data-testid={`${id}-readout`}
        className="mb-3 text-sm font-bold tabular-nums text-ink"
        aria-live="polite"
      >
        {describe(min, max)}
      </p>
      <div className="price-range relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-sunken" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-plate"
          style={{ left: `${pct(minV)}%`, right: `${100 - pct(maxV)}%` }}
        />
        <input
          type="range"
          id={`${id}-min`}
          aria-label="Giá tối thiểu"
          min={LO}
          max={HI}
          step={PRICE_STEP}
          value={minV}
          onChange={(e) => {
            setLastMoved("min");
            setMin(Number(e.target.value));
          }}
          aria-valuetext={formatVnd(minV)}
          className={cn("price-range-input", minOnTop ? "z-20" : "z-10")}
        />
        <input
          type="range"
          id={`${id}-max`}
          aria-label="Giá tối đa"
          min={LO}
          max={HI}
          step={PRICE_STEP}
          value={maxV}
          onChange={(e) => {
            setLastMoved("max");
            setMax(Number(e.target.value));
          }}
          aria-valuetext={maxV >= HI ? `${formatVnd(HI)} trở lên` : formatVnd(maxV)}
          className={cn("price-range-input", minOnTop ? "z-10" : "z-20")}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted" aria-hidden="true">
        <span>{formatVnd(LO)}</span>
        <span>{formatVnd(HI)}+</span>
      </div>
    </div>
  );
}
