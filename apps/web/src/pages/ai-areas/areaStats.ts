import { formatVnd } from "@/lib/format";
import type { AiAreaSuggestion } from "@/types/api";

type Stats = AiAreaSuggestion["stats"];

/** "2.900.000đ/tháng trung bình · 1.2 km tới trường"; each half only when known. */
export function statsLine(stats: Stats): string {
  const parts: string[] = [];
  if (stats?.avg_price != null) parts.push(`${formatVnd(stats.avg_price)}/tháng trung bình`);
  if (stats?.distance_to_school_km != null) {
    parts.push(`${String(stats.distance_to_school_km)} km tới trường`);
  }
  return parts.join(" · ");
}

/** "12 tin đăng", or nothing when the count is unknown. */
export function listingsCountLine(stats: Stats): string {
  return stats?.listings_count != null ? `${String(stats.listings_count)} tin đăng` : "";
}
