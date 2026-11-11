import * as React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

export function Footer() {
  const { VITE_SOCIAL_FACEBOOK, VITE_SOCIAL_INSTAGRAM, VITE_SOCIAL_YOUTUBE } = useEnv();
  const socials = [
    { label: "Facebook", url: VITE_SOCIAL_FACEBOOK },
    { label: "Instagram", url: VITE_SOCIAL_INSTAGRAM },
    { label: "YouTube", url: VITE_SOCIAL_YOUTUBE },
  ].filter((s) => s.url);

  return (
    <footer data-testid="site-footer" className="relative border-t border-line bg-card">
      <div className="mx-auto max-w-5xl px-5 py-6 text-center">
        <nav
          aria-label="Chân trang"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          <FooterLink to={ROUTES.ROOMS}>Tìm phòng</FooterLink>
          <FooterLink to={ROUTES.REGISTER}>Đăng tin</FooterLink>
          <FooterLink to={ROUTES.LANDLORD}>Quản lý tin đăng</FooterLink>
          <FooterLink to={ROUTES.HOME}>Trợ giúp</FooterLink>
        </nav>
        <p className="mt-4 text-xs text-muted">© 2026 TROSV</p>
        {socials.length > 0 ? (
          <div className="mt-3 flex items-center justify-center gap-1">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-ink-2",
                  "transition-colors hover:bg-tint hover:text-ink",
                )}
              >
                <SocialIcon />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  );
}

/* Tailwind v4 needs env vars at runtime — read once via import.meta.env. */
function useEnv() {
  return {
    VITE_SOCIAL_FACEBOOK: import.meta.env.VITE_SOCIAL_FACEBOOK as string | undefined,
    VITE_SOCIAL_INSTAGRAM: import.meta.env.VITE_SOCIAL_INSTAGRAM as string | undefined,
    VITE_SOCIAL_YOUTUBE: import.meta.env.VITE_SOCIAL_YOUTUBE as string | undefined,
  };
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="py-1 text-sm text-ink-2 transition-colors hover:text-ink hover:underline"
    >
      {children}
    </Link>
  );
}

function SocialIcon() {
  /* Simple inline glyph for footer socials; real logos come from the
     env-var-driven URLs. Keeps icons inside our tokens, no brand SVGs.
     The wrapping <a> already carries aria-label={label}. */
  return (
    <span className="text-sm" aria-hidden>
      •
    </span>
  );
}
