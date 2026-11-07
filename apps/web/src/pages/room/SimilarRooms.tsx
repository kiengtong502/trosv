import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getListings } from "@/api/listingApi";
import { route, ROUTES } from "@/constants/routes";
import { formatPriceShort } from "@/lib/format";
import { HousePlaceholder } from "@/ui/icons";
import type { Listing } from "@/types/api";

/** Other rooms in the same ward: 4:3 thumbnails, a swipeable row on phones. */
export function SimilarRooms({ listing }: { listing: Listing }) {
  const wardId = listing.ward?.id ?? listing.ward_id;
  const [rooms, setRooms] = useState<Listing[]>([]);

  useEffect(() => {
    if (wardId == null) return;
    let live = true;
    getListings({ ward_id: wardId, per_page: 6 })
      .then(({ data }) => {
        if (live) setRooms(data.filter((r) => r.id !== listing.id).slice(0, 4));
      })
      .catch(() => {
        /* a missing "similar" row is not worth an error state */
      });
    return () => {
      live = false;
    };
  }, [wardId, listing.id]);

  if (rooms.length === 0) return null;

  return (
    <section data-testid="room-similar" className="mt-10">
      <h2 className="mb-4 text-xl font-extrabold text-ink">Phòng tương tự gần đó</h2>
      <div
        data-testid="similar-row"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {rooms.map((r) => {
          const photo = r.cover_image ?? r.images?.[0]?.url ?? null;
          return (
            <Link
              key={r.id}
              to={route(ROUTES.ROOM_DETAIL, { id: r.id })}
              className="motion-card w-[62%] flex-none snap-start overflow-hidden rounded-lg border border-line bg-card shadow-card lg:w-auto"
            >
              <div data-testid="similar-thumb" className="relative aspect-4/3 bg-sunken">
                {photo ? (
                  <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <HousePlaceholder />
                )}
                <span className="absolute bottom-2 left-2 rounded bg-flyer px-1.5 py-0.5 text-[13px] font-extrabold tabular-nums text-flyer-ink">
                  {formatPriceShort(r.price)}/th
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-ink">{r.title}</p>
                <p className="mt-1 truncate text-xs text-muted">{r.address}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
