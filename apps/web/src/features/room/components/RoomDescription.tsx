import type { Listing } from "@/shared/types/api";
import { PANEL } from "../lib/panel";

const HEADING = "mb-3 text-xs font-bold uppercase tracking-wider text-muted";

/** Description and amenities side by side, including missing amenity information. */
export function RoomDescription({ listing }: { listing: Listing }) {
  const amenities = listing.amenities ?? [];

  return (
    <div className={`mt-4 grid gap-4 ${listing.description ? "lg:grid-cols-[7fr_5fr]" : ""}`}>
      {listing.description ? (
        <section className={PANEL}>
          <h2 className={HEADING}>Mô tả</h2>
          <p className="whitespace-pre-line text-base leading-relaxed text-ink-2">
            {listing.description}
          </p>
        </section>
      ) : null}
      <section className={PANEL}>
        <h2 className={HEADING}>Tiện ích</h2>
        {amenities.length > 0 ? (
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
        ) : (
          <p className="text-sm text-muted">Chủ nhà chưa cung cấp thông tin tiện ích.</p>
        )}
      </section>
    </div>
  );
}
