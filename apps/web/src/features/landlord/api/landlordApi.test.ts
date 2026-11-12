import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing, ListingPayload } from "@/shared/types/api";
import {
  createListing,
  deleteImage,
  deleteListing,
  getMyListings,
  updateListing,
  uploadImages,
} from "./landlordApi";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/shared/api/axiosClient", () => ({ default: http }));

const LISTING = { id: 11, title: "Phòng A" } as Listing;
const PAYLOAD = { title: "Phòng A", price: 2500000 } as ListingPayload;
const reply = <T>(data: T) => ({ data: { data } });

beforeEach(() => {
  Object.values(http).forEach((fn) => {
    fn.mockReset();
  });
});

describe("landlordApi", () => {
  it("lists my listings page by page, with data and pagination meta", async () => {
    http.get.mockResolvedValue({
      data: { data: [LISTING], meta: { current_page: 2, last_page: 3, total: 25 } },
    });
    await expect(getMyListings(2, "available")).resolves.toEqual({
      data: [LISTING],
      meta: { current_page: 2, last_page: 3, total: 25 },
    });
    expect(http.get).toHaveBeenCalledWith("/my/listings", {
      params: { page: 2, status: "available" },
    });
  });

  it("omits the status filter when it is empty (all listings)", async () => {
    http.get.mockResolvedValue({ data: { data: [], meta: {} } });
    await getMyListings();
    expect(http.get).toHaveBeenCalledWith("/my/listings", {
      params: { page: 1, status: undefined },
    });
  });

  it("creates a listing and returns the stored one", async () => {
    http.post.mockResolvedValue(reply(LISTING));
    await expect(createListing(PAYLOAD)).resolves.toEqual(LISTING);
    expect(http.post).toHaveBeenCalledWith("/listings", PAYLOAD);
  });

  it("updates a listing by id with a partial payload", async () => {
    http.put.mockResolvedValue(reply({ ...LISTING, price: 3000000 }));
    await expect(updateListing(11, { price: 3000000 })).resolves.toMatchObject({ price: 3000000 });
    expect(http.put).toHaveBeenCalledWith("/listings/11", { price: 3000000 });
  });

  it("deletes a listing", async () => {
    http.delete.mockResolvedValue({ status: 204 });
    await deleteListing(11);
    expect(http.delete).toHaveBeenCalledWith("/listings/11");
  });

  it("uploads every photo as images[] in one multipart request", async () => {
    http.post.mockResolvedValue(reply(LISTING));
    const a = new File(["a"], "a.png", { type: "image/png" });
    const b = new File(["b"], "b.png", { type: "image/png" });

    await uploadImages(11, [a, b]);

    const call = http.post.mock.calls[0] as [string, FormData, { headers: Record<string, string> }];
    expect(call[0]).toBe("/listings/11/images");
    expect(call[1].getAll("images[]")).toEqual([a, b]);
    expect(call[2].headers["Content-Type"]).toBe("multipart/form-data");
  });

  it("deletes one photo of a listing", async () => {
    http.delete.mockResolvedValue({});
    await deleteImage(11, 4);
    expect(http.delete).toHaveBeenCalledWith("/listings/11/images/4");
  });

  it("propagates API failures to the caller", async () => {
    const failure = new Error("403");
    http.put.mockRejectedValue(failure);
    await expect(updateListing(11, {})).rejects.toBe(failure);
  });
});
