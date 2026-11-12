import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing, PaginationMeta, Review } from "@/shared/types/api";
import { useRoomDetail } from "./useRoomDetail";

const api = vi.hoisted(() => ({ getListing: vi.fn(), getListingReviews: vi.fn() }));
vi.mock("@/features/listings/api/listingApi", () => api);

const room = (id: number) => ({ id, title: `Phòng ${id}` }) as Listing;
const REVIEW = { id: 1, comment: "Tốt" } as Review;
const META = { current_page: 1, last_page: 2 } as PaginationMeta;
const httpError = (status: number, message?: string) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data: message ? { message } : {},
  } as AxiosResponse);

beforeEach(() => {
  api.getListing.mockReset();
  api.getListingReviews.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("useRoomDetail", () => {
  it("loads the room, then its first page of reviews", async () => {
    api.getListing.mockResolvedValue(room(12));
    api.getListingReviews.mockResolvedValue({ data: [REVIEW], meta: META });
    const { result } = renderHook(() => useRoomDetail(12));

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await waitFor(() => {
      expect(result.current.reviews).toEqual([REVIEW]);
    });
    expect(result.current.listing?.title).toBe("Phòng 12");
    expect(result.current.reviewMeta).toEqual(META);
    expect(result.current.error).toBe("");
    expect(api.getListingReviews).toHaveBeenCalledWith(12, 1);
  });

  it("explains a missing or hidden room in plain words", async () => {
    api.getListing.mockRejectedValue(httpError(404));
    const { result } = renderHook(() => useRoomDetail(99));

    await waitFor(() => {
      expect(result.current.error).toBe("Phòng trọ không tồn tại hoặc đã bị ẩn.");
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.listing).toBeNull();
    expect(api.getListingReviews).not.toHaveBeenCalled();
  });

  it("shows the server's message for other failures", async () => {
    api.getListing.mockRejectedValue(httpError(500, "Máy chủ đang bảo trì."));
    const { result } = renderHook(() => useRoomDetail(1));
    await waitFor(() => {
      expect(result.current.error).toBe("Máy chủ đang bảo trì.");
    });
  });

  it("still shows the room when its reviews fail to load (and logs it)", async () => {
    api.getListing.mockResolvedValue(room(12));
    api.getListingReviews.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useRoomDetail(12));

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("load room reviews"),
        expect.anything(),
      );
    });
    expect(result.current.listing?.id).toBe(12);
    expect(result.current.error).toBe("");
    expect(result.current.reviews).toEqual([]);
  });

  it("loadReviews fetches another page", async () => {
    api.getListing.mockResolvedValue(room(12));
    api.getListingReviews.mockResolvedValue({ data: [REVIEW], meta: META });
    const { result } = renderHook(() => useRoomDetail(12));
    await waitFor(() => {
      expect(result.current.reviews).toHaveLength(1);
    });

    const page2 = { id: 2, comment: "Ổn" } as Review;
    api.getListingReviews.mockResolvedValue({ data: [page2], meta: { current_page: 2 } });
    act(() => {
      result.current.loadReviews(2);
    });

    await waitFor(() => {
      expect(result.current.reviews).toEqual([page2]);
    });
    expect(api.getListingReviews).toHaveBeenLastCalledWith(12, 2);
  });

  it("starts from a clean slate when the room id changes", async () => {
    api.getListing.mockImplementation((id: number) => Promise.resolve(room(id)));
    api.getListingReviews.mockResolvedValue({ data: [REVIEW], meta: META });
    const { result, rerender } = renderHook(({ id }) => useRoomDetail(id), {
      initialProps: { id: 1 },
    });
    await waitFor(() => {
      expect(result.current.listing?.id).toBe(1);
    });

    api.getListingReviews.mockReturnValue(new Promise(() => undefined));
    rerender({ id: 2 });

    // Immediately after the switch, nothing of room 1 is left on screen.
    expect(result.current.listing).toBeNull();
    expect(result.current.reviews).toEqual([]);
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.listing?.id).toBe(2);
    });
    expect(api.getListing).toHaveBeenLastCalledWith(2);
  });
});
