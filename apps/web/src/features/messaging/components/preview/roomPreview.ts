import type { Listing } from "@/shared/types/api";

/** "Căn hộ", "Nhà nguyên căn" or the default "Phòng trọ". */
export function roomTypeLabel(type: string | null | undefined): string {
  if (type === "apartment") return "Căn hộ";
  if (type === "house") return "Nhà nguyên căn";
  return "Phòng trọ";
}

/** "Hải Châu, Đà Nẵng" from the ward and city, else the street address. */
export function roomLocationText(room: Pick<Listing, "ward" | "city_name" | "address">): string {
  const parts = [room.ward?.name, room.ward?.city?.name ?? room.city_name].filter(Boolean);
  return parts.join(", ") || room.address;
}
