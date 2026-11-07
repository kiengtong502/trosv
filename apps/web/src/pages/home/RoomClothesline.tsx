import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ROUTES, route } from "@/constants/routes";
import { formatPriceShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HousePlaceholder } from "@/ui/icons";
import { Skeleton } from "@/ui/badge";
import type { Listing } from "@/types/api";
import { PEG_COLORS, Peg } from "./Peg";

/** The rope segment behind one card; neighbours join into one continuous line. */
function Rope() {
  return (
    <svg
      viewBox="0 0 268 22"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 h-[22px] w-full overflow-visible"
    >
      <path d="M0 7 Q134 11 268 7" fill="none" stroke="#7a5b3a" strokeWidth="3.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path
        d="M0 7 Q134 11 268 7"
        fill="none"
        stroke="#d8b886"
        strokeWidth="3.4"
        strokeDasharray="2.5 6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Hang({ listing, index }: { listing: Listing; index: number }) {
  const photo = listing.cover_image ?? listing.images?.[0]?.url ?? null;
  return (
    <li className="relative w-[62%] flex-none snap-start px-2.5 pt-[9px] md:w-[268px]">
      <Rope />
      <div className="hang-sway relative" style={{ animationDelay: `${-((index * 1.7) % 6)}s` }}>
        <span
          data-testid="hang-peg"
          className="absolute left-1/2 top-[-25px] z-10 h-[62px] w-8 -translate-x-1/2 drop-shadow-[0_3px_2px_rgb(0_0_0/0.22)]"
        >
          <Peg color={PEG_COLORS[index % PEG_COLORS.length] ?? PEG_COLORS[0]} className="size-full" />
        </span>
        <Link
          data-testid="hang-card"
          to={route(ROUTES.ROOM_DETAIL, { id: listing.id })}
          className="motion-card block overflow-hidden rounded-xl border border-line bg-card shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
        >
          <div className="relative aspect-4/3 bg-sunken">
            {photo ? (
              <img src={photo} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
            ) : (
              <HousePlaceholder />
            )}
            <span className="absolute bottom-2.5 left-2.5 rounded-md bg-flyer px-2 py-0.5 text-sm font-extrabold tabular-nums text-flyer-ink">
              {formatPriceShort(listing.price)}/th
            </span>
          </div>
          <div className="px-3.5 pb-3.5 pt-3">
            <p className="line-clamp-2 text-[15px] font-bold leading-snug text-ink">{listing.title}</p>
            <p className="mt-1 truncate text-xs text-muted">{listing.address}</p>
          </div>
        </Link>
      </div>
    </li>
  );
}

function Arrow({ dir, visible, onClick }: { dir: -1 | 1; visible: boolean; onClick: () => void }) {
  const Icon = dir < 0 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={dir < 0 ? "hang-prev" : "hang-next"}
      aria-label={dir < 0 ? "Cuộn sang trái" : "Cuộn sang phải"}
      data-visible={visible}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "motion-press absolute top-[42%] z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-card text-ink shadow-card transition-[opacity,transform] duration-200 md:grid",
        dir < 0 ? "-left-3" : "-right-3",
        visible ? "opacity-100" : "pointer-events-none scale-90 opacity-0"
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

export interface RoomClotheslineProps {
  listings: Listing[];
  loading: boolean;
}

/** One swipeable line of recent rooms, each clipped to a rope with a peg. */
export function RoomClothesline({ listings, loading }: RoomClotheslineProps) {
  const rowRef = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [measure, listings.length]);

  function scrollBy(dir: -1 | 1): void {
    rowRef.current?.scrollBy({ left: dir * 560, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="flex gap-5 overflow-hidden pt-4" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-72 w-[268px] flex-none rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <Arrow dir={-1} visible={!edge.start} onClick={() => { scrollBy(-1); }} />
      <ul
        ref={rowRef}
        data-testid="hang-row"
        onScroll={measure}
        className="-ml-2.5 -mr-5 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-pl-0 pb-8 pr-5 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {listings.map((l, i) => (
          <Hang key={l.id} listing={l} index={i} />
        ))}
      </ul>
      <Arrow dir={1} visible={!edge.end} onClick={() => { scrollBy(1); }} />
    </div>
  );
}
