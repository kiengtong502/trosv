import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
  PlateBand: the navy "street-name plate" that opens a page. One component,
  three sizes, so every page shares the same brand moment.

  - hero:   full Home hero. `backdrop` (artwork) sits behind the content.
  - strip:  slim bar for tools (search + filters). No heading.
  - header: compact page title with an optional description and actions.

  The highlighted keyword is the one place flyer yellow appears in a title.
*/

export interface PlateBandProps {
  size: "hero" | "strip" | "header";
  title?: ReactNode;
  /** Keyword shown on a yellow flyer tab after the title. */
  highlight?: string;
  description?: ReactNode;
  /** Right-aligned buttons (header size). */
  actions?: ReactNode;
  /** Artwork rendered behind the content (hero size). */
  backdrop?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/* Fixed dark ink: the yellow tab must stay legible in dark mode too. */
const MARK = "rounded-md bg-flyer px-2 text-[#1c1915]";

export function PlateBand({
  size,
  title,
  highlight,
  description,
  actions,
  backdrop,
  children,
  className,
}: PlateBandProps) {
  const heading =
    title != null || highlight ? (
      <h1
        className={cn(
          "font-display font-extrabold tracking-tight text-white",
          size === "hero"
            ? "max-w-2xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            : "text-2xl sm:text-3xl"
        )}
      >
        {title}
        {highlight ? (
          <>
            {title != null ? (size === "hero" ? <br /> : " ") : null}
            <mark
              className={cn(
                MARK,
                "box-decoration-clone",
                size === "hero" ? "inline-block w-fit leading-[1.15]" : "inline-block"
              )}
            >
              {highlight}
            </mark>
          </>
        ) : null}
      </h1>
    ) : null;

  const intro = description ? (
    <p className="mt-1 max-w-2xl text-sm text-white/80 sm:text-base">{description}</p>
  ) : null;

  if (size === "strip") {
    return (
      <section
        data-testid="plate-band"
        data-size="strip"
        className={cn("relative z-10 bg-band text-white shadow-seam", className)}
      >
        <div className="flex min-h-16 w-full items-center gap-3 px-4 py-3 sm:px-6">{children}</div>
      </section>
    );
  }

  if (size === "header") {
    return (
      <section
        data-testid="plate-band"
        data-size="header"
        className={cn("relative z-10 bg-band text-white shadow-seam", className)}
      >
        <div className="mx-auto flex min-h-[120px] w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="min-w-0">
            {heading}
            {intro}
            {children}
          </div>
          {actions ? <div className="flex flex-none items-center gap-2">{actions}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="plate-band"
      data-size="hero"
      className={cn(
        "relative z-10 flex items-center overflow-hidden bg-band text-white shadow-seam md:min-h-[420px]",
        className
      )}
    >
      {backdrop}
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:gap-6 md:px-8 md:py-12">
        {heading}
        {intro}
        {children}
      </div>
    </section>
  );
}
