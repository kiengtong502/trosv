import { Link } from "react-router-dom";
import { ROUTES, route } from "@/constants/routes";
import { formatPriceShort } from "@/lib/format";
import { HousePlaceholder } from "@/ui/icons";
import type { Listing } from "@/types/api";

/*
  The three newest rooms, fanned out and gently floating at the right of the
  hero. Decorative: the same rooms are on the clothesline below, so these are
  out of the tab order and hidden from screen readers.
*/
const SPOTS = [
  "left-[2%] top-[44px] -rotate-6",
  "left-[34%] top-0 rotate-3 z-10",
  "left-[62%] top-[64px] rotate-[7deg]",
];

export function HeroDeck({ listings }: { listings: Listing[] }) {
  const shown = listings.slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <div
      data-testid="hero-deck"
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] max-w-[560px] min-[1180px]:block"
    >
      <div className="relative mx-auto h-full max-h-[380px] translate-y-[8%]">
        {shown.map((l, i) => {
          const photo = l.cover_image ?? l.images?.[0]?.url ?? null;
          return (
            <Link
              key={l.id}
              to={route(ROUTES.ROOM_DETAIL, { id: l.id })}
              tabIndex={-1}
              className={`motion-float pointer-events-auto absolute w-[210px] overflow-hidden rounded-xl border border-line bg-card text-ink shadow-pop ${SPOTS[i] ?? ""}`}
              style={{ animationDelay: `${-i * 2}s` }}
            >
              <div className="relative aspect-4/3 bg-sunken">
                {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <HousePlaceholder />}
                <span className="absolute bottom-2 left-2 rounded-md bg-flyer px-2 py-0.5 text-xs font-extrabold tabular-nums text-flyer-ink">
                  {formatPriceShort(l.price)}/th
                </span>
              </div>
              <p className="line-clamp-2 px-3 py-2.5 text-sm font-bold leading-snug">{l.title}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
