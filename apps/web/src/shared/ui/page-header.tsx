import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/*
  PageHeader: the plain title block for pages that do not use the navy band
  (the band is reserved for the Home hero, the Search strip and the auth
  panel). Dark title on the cream page, optional yellow-underlined keyword.
*/

export interface PageHeaderProps {
  title: ReactNode;
  /** Keyword drawn after the title with a flyer-yellow underline tab. */
  highlight?: string;
  description?: ReactNode;
  /** Avatar or icon before the title. */
  leading?: ReactNode;
  /** Right-aligned buttons. */
  actions?: ReactNode;
  /** Column width and padding, so the header lines up with the page below. */
  className?: string;
}

export function PageHeader({
  title,
  highlight,
  description,
  leading,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      data-testid="page-header"
      className={cn("mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 lg:px-8", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {leading}
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {title}
              {highlight ? (
                <>
                  {" "}
                  <mark className="rounded-md bg-flyer px-2 text-flyer-ink box-decoration-clone">
                    {highlight}
                  </mark>
                </>
              ) : null}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-none items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
