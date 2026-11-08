import { describe, expect, it } from "vitest";
import { listingsCountLine, statsLine } from "./areaStats";

describe("statsLine", () => {
  it("shows both facts joined by a dot", () => {
    expect(statsLine({ avg_price: 2_900_000, distance_to_school_km: 1.2 })).toBe(
      "2.900.000đ/tháng trung bình · 1.2 km tới trường",
    );
  });

  it("shows only the price when there is no distance", () => {
    expect(statsLine({ avg_price: 3_000_000 })).toBe("3.000.000đ/tháng trung bình");
  });

  it("shows only the distance when there is no price", () => {
    expect(statsLine({ distance_to_school_km: 0.8 })).toBe("0.8 km tới trường");
  });

  it("keeps a zero price and zero distance (0 is known)", () => {
    expect(statsLine({ avg_price: 0, distance_to_school_km: 0 })).toBe(
      "0đ/tháng trung bình · 0 km tới trường",
    );
  });

  it("is empty for missing stats", () => {
    expect(statsLine(undefined as never)).toBe("");
    expect(statsLine({})).toBe("");
  });
});

describe("listingsCountLine", () => {
  it("counts listings, including zero", () => {
    expect(listingsCountLine({ listings_count: 12 })).toBe("12 tin đăng");
    expect(listingsCountLine({ listings_count: 0 })).toBe("0 tin đăng");
  });

  it("is empty when unknown", () => {
    expect(listingsCountLine({})).toBe("");
    expect(listingsCountLine(undefined as never)).toBe("");
  });
});
