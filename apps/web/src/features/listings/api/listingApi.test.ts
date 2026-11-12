import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Review } from "@/shared/types/api";
import { createReview } from "./listingApi";

const http = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/shared/api/axiosClient", () => ({ default: http }));

beforeEach(() => {
  http.post.mockReset();
});

describe("createReview", () => {
  it("posts both ratings and the comment to the listing's reviews and unwraps the review", async () => {
    const stored = { id: 9, listing_rating: 4, landlord_rating: 5 } as Review;
    http.post.mockResolvedValue({ data: { data: stored } });

    await expect(
      createReview(12, { listing_rating: 4, landlord_rating: 5, comment: "Tốt" }),
    ).resolves.toEqual(stored);
    expect(http.post).toHaveBeenCalledWith("/listings/12/reviews", {
      listing_rating: 4,
      landlord_rating: 5,
      comment: "Tốt",
    });
  });

  it("lets API errors (403 not allowed, 422 duplicate) reach the caller", async () => {
    const failure = new Error("403");
    http.post.mockRejectedValue(failure);
    await expect(createReview(12, { listing_rating: 1, landlord_rating: 1 })).rejects.toBe(failure);
  });
});
