import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { RATING_WORDS } from "../lib/reviewForm";

export interface StarRatingInputProps {
  /** Radio group name; also prefixes the element ids. */
  name: string;
  label: string;
  /** 0 = nothing chosen. */
  value: number;
  onChange: (value: number) => void;
  error?: string | undefined;
}

/**
 * Five stars as a radio group (arrow keys, one tab stop, screen-reader friendly). The stars
 * use the same ink glyph as the read-only `Rating`; hovering previews a rating before it is
 * chosen, and the chosen rating is also written out in words.
 */
export function StarRatingInput({ name, label, value, onChange, error }: StarRatingInputProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const errorId = `${name}-error`;

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-medium leading-none text-ink">
        {label}
        <span aria-hidden className="ml-1 text-plate">
          *
        </span>
      </legend>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center"
          onMouseLeave={() => {
            setHover(0);
          }}
        >
          {RATING_WORDS.map((word, index) => {
            const stars = index + 1;
            const filled = stars <= shown;
            return (
              <label
                key={stars}
                className="cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-plate"
                onMouseEnter={() => {
                  setHover(stars);
                }}
              >
                <input
                  type="radio"
                  name={name}
                  value={stars}
                  checked={value === stars}
                  onChange={() => {
                    onChange(stars);
                  }}
                  aria-label={`${stars} sao - ${word}`}
                  className="sr-only"
                />
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    filled ? "fill-ink stroke-ink" : "fill-transparent stroke-line-strong",
                  )}
                  aria-hidden
                />
              </label>
            );
          })}
        </div>
        <span aria-live="polite" className="min-h-5 text-sm font-medium text-ink-2">
          {shown > 0 ? RATING_WORDS[shown - 1] : ""}
        </span>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-normal text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
