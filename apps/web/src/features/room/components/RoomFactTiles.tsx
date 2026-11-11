import type { CSSProperties } from "react";
import { Clock, GraduationCap, Home, Ruler } from "lucide-react";
import { TYPE_LABELS } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { Listing } from "@/shared/types/api";

interface Tile {
  icon: typeof Ruler;
  value: string;
  label: string;
  tone: string;
}

const MS_PER_DAY = 86_400_000;

/** The quick facts that exist for this listing, in display order. */
export function buildFactTiles(listing: Listing, now: number): Tile[] {
  const tiles: Tile[] = [];
  if (listing.area_m2 != null) {
    tiles.push({
      icon: Ruler,
      value: `${listing.area_m2} m²`,
      label: "Diện tích",
      tone: "bg-flyer/25",
    });
  }
  const km = listing.distance_km;
  if (km != null) {
    tiles.push({
      icon: GraduationCap,
      value: `${km.toFixed(1)} km`,
      label: `Tới trường · ~${Math.max(1, Math.round(km * 3))} phút xe`,
      tone: "bg-plate-tint",
    });
  }
  tiles.push({
    icon: Home,
    value: TYPE_LABELS[listing.type ?? ""] ?? "Phòng trọ",
    label: "Loại phòng",
    tone: "bg-moss-tint",
  });
  if (listing.created_at) {
    const daysAgo = Math.max(
      0,
      Math.floor((now - new Date(listing.created_at).getTime()) / MS_PER_DAY),
    );
    tiles.push({
      icon: Clock,
      value: daysAgo === 0 ? "Hôm nay" : `${daysAgo} ngày`,
      label: daysAgo === 0 ? "Đăng tin" : "Trước đây đăng",
      tone: "bg-danger-tint",
    });
  }
  return tiles;
}

export function RoomFactTiles({ listing, now }: { listing: Listing; now: number }) {
  const tiles = buildFactTiles(listing, now);
  return (
    <div
      className="motion-stagger mt-4 grid grid-cols-2 gap-4 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
      style={{ "--n": tiles.length } as CSSProperties}
    >
      {tiles.map((t) => (
        <div
          key={t.label}
          data-testid="fact-tile"
          className={cn("rounded-xl border border-line p-4 shadow-card", t.tone)}
        >
          <t.icon className="mb-3 size-5 text-ink-2" aria-hidden />
          <p className="text-xl font-extrabold tabular-nums text-ink">{t.value}</p>
          <p className="mt-0.5 text-xs text-muted">{t.label}</p>
        </div>
      ))}
    </div>
  );
}
