import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { BandBackdrop } from "@/shared/ui/band-backdrop";

/* Auth layout: the same navy band + quiet icon pattern as the Home hero fills
   the page, and the form sits in one centered white card. Standalone page —
   no header, rail or footer. Used by Login and Register. */
export function AuthSplit({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      data-testid="auth-page"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-band px-4 py-10"
    >
      <BandBackdrop />
      <div
        data-testid="auth-card"
        className="relative w-full max-w-[500px] rounded-xl border border-line bg-card p-8 shadow-pop sm:p-10"
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link to={ROUTES.HOME} aria-label="TROSV trang chủ">
            <img src="/trosv-logo.svg" alt="TROSV" className="trosv-logo h-8 w-auto" />
          </Link>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
