import { describe, expect, it } from "vitest";
import type { Listing } from "@/types/api";
import { buildFactTiles } from "./RoomFactTiles";

const NOW = new Date("2026-11-07T12:00:00Z").getTime();
const DAY = 86_400_000;

const listing = (over: Partial<Listing> = {}): Listing =>
  ({ id: 1, title: "Phòng", price: 2_000_000, type: "room", ...over }) as Listing;

const labels = (l: Listing) => buildFactTiles(l, NOW).map((t) => t.label);

describe("buildFactTiles", () => {
  it("always has the room type, with a Vietnamese label", () => {
    const [tile] = buildFactTiles(listing({ type: "apartment" }), NOW);
    expect(tile).toMatchObject({ value: "Căn hộ", label: "Loại phòng" });
  });

  it("falls back to 'Phòng trọ' for an unknown or missing type", () => {
    expect(buildFactTiles(listing({ type: "castle" }), NOW)[0]?.value).toBe("Phòng trọ");
    expect(buildFactTiles(listing({ type: "" }), NOW)[0]?.value).toBe("Phòng trọ");
  });

  it("adds the area first when known", () => {
    const tiles = buildFactTiles(listing({ area_m2: 24 }), NOW);
    expect(tiles[0]).toMatchObject({ value: "24 m²", label: "Diện tích" });
  });

  it("keeps a zero area (0 is known, not missing)", () => {
    expect(buildFactTiles(listing({ area_m2: 0 }), NOW)[0]?.value).toBe("0 m²");
  });

  it("adds the distance to school, rounded to 1 decimal, with a ride-time estimate", () => {
    const tile = buildFactTiles(listing({ distance_km: 1.234 }), NOW).find(
      (t) => t.value === "1.2 km",
    );
    expect(tile?.label).toBe("Tới trường · ~4 phút xe");
  });

  it("never estimates under 1 minute", () => {
    const tile = buildFactTiles(listing({ distance_km: 0.1 }), NOW).find(
      (t) => t.value === "0.1 km",
    );
    expect(tile?.label).toBe("Tới trường · ~1 phút xe");
  });

  it("says 'Hôm nay' for a listing posted today", () => {
    const tiles = buildFactTiles(
      listing({ created_at: new Date(NOW - 3_600_000).toISOString() }),
      NOW,
    );
    expect(tiles.at(-1)).toMatchObject({ value: "Hôm nay", label: "Đăng tin" });
  });

  it("counts whole days for older listings", () => {
    const tiles = buildFactTiles(
      listing({ created_at: new Date(NOW - 3 * DAY - 1000).toISOString() }),
      NOW,
    );
    expect(tiles.at(-1)).toMatchObject({ value: "3 ngày", label: "Trước đây đăng" });
  });

  it("never goes negative for a future timestamp (clock skew)", () => {
    const tiles = buildFactTiles(listing({ created_at: new Date(NOW + DAY).toISOString() }), NOW);
    expect(tiles.at(-1)?.value).toBe("Hôm nay");
  });

  it("omits area, distance and age when unknown", () => {
    expect(labels(listing())).toEqual(["Loại phòng"]);
  });

  it("lists all four in order when everything is known", () => {
    const all = listing({
      area_m2: 20,
      distance_km: 2,
      created_at: new Date(NOW - DAY).toISOString(),
    });
    expect(labels(all)).toEqual([
      "Diện tích",
      "Tới trường · ~6 phút xe",
      "Loại phòng",
      "Trước đây đăng",
    ]);
  });
});
