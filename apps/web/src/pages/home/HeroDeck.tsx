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
/*
  A fixed-size cluster (not a percentage of the screen) so it looks the same on
  every display. The middle card sits higher and on top: it only ever covers the
  photo edges of its neighbours, never their text or price.
*/
const SPOTS = [
  { place: "left-0 top-[84px] -rotate-6", badge: "left-2" },
  { place: "left-[140px] top-0 rotate-2 z-10", badge: "left-2" },
  { place: "left-[280px] top-[84px] rotate-6", badge: "right-2" },
];

export function HeroDeck({ listings }: { listings: Listing[] }) {
  const shown = listings.slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <div
      data-testid="hero-deck"
      aria-hidden="true"
      className="pointer-events-none absolute right-5 top-1/2 hidden h-[310px] w-[468px] -translate-y-1/2 min-[1180px]:block"
    >
      <div className="relative size-full">
        {shown.map((l, i) => {
          const spot = SPOTS[i];
          const photo = l.cover_image ?? l.images?.[0]?.url ?? null;
          return (
            <Link
              key={l.id}
              to={route(ROUTES.ROOM_DETAIL, { id: l.id })}
              tabIndex={-1}
              className={`motion-float pointer-events-auto absolute w-[188px] overflow-hidden rounded-xl border border-line bg-card text-ink shadow-pop ${spot?.place ?? ""}`}
              style={{ animationDelay: `${-i * 2}s` }}
            >
              <div className="relative aspect-4/3 bg-sunken">
                {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <HousePlaceholder />}
                <span className={`absolute bottom-2 ${spot?.badge ?? "left-2"} rounded-md bg-flyer px-2 py-0.5 text-xs font-extrabold tabular-nums text-flyer-ink`}>
                  {formatPriceShort(l.price)}/th
                </span>
              </div>
              <div className="px-3 py-2.5"><p className="line-clamp-2 h-[2.6em] text-[13px] font-bold leading-snug">{l.title}</p></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
