import { describe, expect, it } from "vitest";
import type { Listing } from "@/types/api";
import {
  EMPTY_FORM,
  MAX_PHOTOS,
  buildDescriptionRequest,
  buildListingPayload,
  decideAddressGuess,
  formFromListing,
  photoLimitError,
  toggleId,
} from "./listingFormModel";

const FILLED = {
  ...EMPTY_FORM,
  title: "Phòng gác lửng",
  type: "apartment",
  price: "2900000",
  area_m2: "24",
  address: "214 Lương Nhữ Học",
  latitude: "16.06",
  longitude: "108.22",
  city_id: "1",
  ward_id: "10",
  description: "Thoáng mát",
  amenity_ids: [1, 2],
  status: "rented",
};

describe("formFromListing", () => {
  it("copies a full listing into form values", () => {
    const listing = {
      title: "Phòng A",
      type: "house",
      price: 3_000_000,
      area_m2: 30,
      address: "1 Đường B",
      latitude: 16.1,
      longitude: 108.2,
      ward: { id: 10, name: "Hải Châu", city: { id: 1, name: "Đà Nẵng" } },
      description: "Mô tả",
      amenities: [{ id: 4 }, { id: 7 }],
      status: "hidden",
    } as unknown as Listing;
    expect(formFromListing(listing)).toEqual({
      title: "Phòng A",
      type: "house",
      price: 3_000_000,
      area_m2: 30,
      address: "1 Đường B",
      latitude: 16.1,
      longitude: 108.2,
      city_id: 1,
      ward_id: 10,
      description: "Mô tả",
      amenity_ids: [4, 7],
      status: "hidden",
    });
  });

  it("fills sensible defaults for a sparse listing", () => {
    const form = formFromListing({ price: 1_000_000 } as unknown as Listing);
    expect(form).toMatchObject({
      title: "",
      type: "room",
      area_m2: "",
      latitude: "",
      city_id: "",
      ward_id: "",
      description: "",
      amenity_ids: [],
      status: "available",
    });
  });
});

describe("buildListingPayload", () => {
  it("turns the text fields into numbers", () => {
    expect(buildListingPayload(FILLED, false)).toMatchObject({
      price: 2_900_000,
      area_m2: 24,
      latitude: 16.06,
      longitude: 108.22,
      ward_id: 10,
      amenity_ids: [1, 2],
    });
  });

  it("sends the status only when editing", () => {
    expect(buildListingPayload(FILLED, false)).not.toHaveProperty("status");
    expect(buildListingPayload(FILLED, true).status).toBe("rented");
  });

  it("sends an empty description as null", () => {
    expect(buildListingPayload({ ...FILLED, description: "" }, false).description).toBeNull();
  });
});

describe("buildDescriptionRequest", () => {
  it("leaves out everything that is still blank", () => {
    expect(buildDescriptionRequest(EMPTY_FORM)).toEqual({
      title: undefined,
      type: "room",
      price: undefined,
      area_m2: undefined,
      address: undefined,
      ward_id: undefined,
      amenity_ids: undefined,
    });
  });

  it("sends numbers for the numeric fields and the chosen amenities", () => {
    expect(buildDescriptionRequest(FILLED)).toMatchObject({
      price: 2_900_000,
      area_m2: 24,
      ward_id: "10",
      amenity_ids: [1, 2],
    });
  });
});

describe("decideAddressGuess", () => {
  it("fills an empty (or whitespace) address without asking", () => {
    expect(decideAddressGuess("", "12 A", "")).toEqual({ action: "fill", address: "12 A" });
    expect(decideAddressGuess("   ", "12 A", "")).toEqual({ action: "fill", address: "12 A" });
  });

  it("keeps an address that already matches", () => {
    expect(decideAddressGuess(" 12 A ", "12 A", "Hải Châu")).toEqual({ action: "keep" });
  });

  it("asks before replacing a different address, adding the ward when the street lacks it", () => {
    expect(decideAddressGuess("99 Z", "12 A", "Hải Châu")).toEqual({
      action: "ask",
      address: "12 A, Hải Châu",
      current: "99 Z",
    });
  });

  it("does not repeat a ward the street already names, or add an unknown one", () => {
    expect(decideAddressGuess("99 Z", "12 A, Hải Châu", "Hải Châu")).toMatchObject({
      address: "12 A, Hải Châu",
    });
    expect(decideAddressGuess("99 Z", "12 A", "")).toMatchObject({ address: "12 A" });
  });
});

describe("photoLimitError", () => {
  it("allows up to the limit when creating", () => {
    expect(photoLimitError(false, 0, MAX_PHOTOS)).toBeNull();
    expect(photoLimitError(false, 0, MAX_PHOTOS + 1)).toBe("Tối đa 5 ảnh mỗi tin.");
  });

  it("counts the photos already on the listing when editing", () => {
    expect(photoLimitError(true, 3, 2)).toBeNull();
    expect(photoLimitError(true, 3, 3)).toBe("Tin đăng chỉ có tối đa 5 ảnh.");
  });
});

describe("toggleId", () => {
  it("adds a missing id and removes a present one, without mutating", () => {
    const ids = [1, 2];
    expect(toggleId(ids, 3)).toEqual([1, 2, 3]);
    expect(toggleId(ids, 1)).toEqual([2]);
    expect(ids).toEqual([1, 2]);
  });
});
