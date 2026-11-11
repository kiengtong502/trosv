import { ListingMap } from "@/features/listings/components/ListingMap";
import type { Listing } from "@/shared/types/api";
import { PANEL } from "../lib/panel";

/** Map of the room; renders nothing when the listing has no coordinates. */
export function RoomLocation({ listing }: { listing: Listing }) {
  if (typeof listing.latitude !== "number" || typeof listing.longitude !== "number") return null;
  return (
    <section className={PANEL}>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Vị trí</h2>
      <div className="h-64 overflow-hidden rounded-lg border border-line">
        <ListingMap
          listings={[listing]}
          selectedId={listing.id}
          onSelect={() => undefined}
          hasLocationFilter
          scrollWheelZoom={false}
          ariaLabel={`Vị trí ${listing.title}`}
        />
      </div>
    </section>
  );
}
