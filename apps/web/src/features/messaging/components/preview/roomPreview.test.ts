import { describe, expect, it } from "vitest";
import { roomLocationText, roomTypeLabel } from "./roomPreview";

describe("roomTypeLabel", () => {
  it.each([
    ["apartment", "Căn hộ"],
    ["house", "Nhà nguyên căn"],
    ["room", "Phòng trọ"],
    ["castle", "Phòng trọ"],
    [null, "Phòng trọ"],
    [undefined, "Phòng trọ"],
  ])("%s -> %s", (type, label) => {
    expect(roomTypeLabel(type)).toBe(label);
  });
});

describe("roomLocationText", () => {
  it("joins ward and city", () => {
    expect(
      roomLocationText({
        ward: { id: 1, name: "Hải Châu", city: { id: 2, name: "Đà Nẵng" } },
        address: "12 A",
      }),
    ).toBe("Hải Châu, Đà Nẵng");
  });

  it("falls back to the flat city name when the ward has no city", () => {
    expect(
      roomLocationText({
        ward: { id: 1, name: "Hải Châu" },
        city_name: "Đà Nẵng",
        address: "12 A",
      }),
    ).toBe("Hải Châu, Đà Nẵng");
  });

  it("uses what it has when only one part exists", () => {
    expect(roomLocationText({ ward: { id: 1, name: "Hải Châu" }, address: "12 A" })).toBe(
      "Hải Châu",
    );
    expect(roomLocationText({ city_name: "Đà Nẵng", address: "12 A" })).toBe("Đà Nẵng");
  });

  it("falls back to the street address when there is no area", () => {
    expect(roomLocationText({ address: "12 Nguyễn Văn Linh" })).toBe("12 Nguyễn Văn Linh");
  });
});
