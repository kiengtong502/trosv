import type { Listing } from "@/shared/types/api";
import { PANEL } from "../lib/panel";

const HEADING = "mb-3 text-xs font-bold uppercase tracking-wider text-muted";

/** Description and amenities side by side; renders nothing if there is neither. */
export function RoomDescription({ listing }: { listing: Listing }) {
  const amenities = listing.amenities ?? [];
  if (!listing.description && amenities.length === 0) return null;

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[7fr_5fr]">
      {listing.description ? (
        <section className={PANEL}>
          <h2 className={HEADING}>Mô tả</h2>
          <p className="whitespace-pre-line text-base leading-relaxed text-ink-2">
            {listing.description}
          </p>
        </section>
      ) : null}
      {amenities.length > 0 ? (
        <section className={PANEL}>
          <h2 className={HEADING}>Tiện ích</h2>
          <div className="grid grid-cols-2 gap-2">
            {amenities.map((a) => (
              <span
                key={a.id}
                className="rounded-lg border border-line bg-paper px-3 py-2 text-sm font-medium text-ink"
              >
                {a.name ?? `Tiện ích ${a.id}`}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
