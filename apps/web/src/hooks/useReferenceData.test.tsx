import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { City } from "@/types/api";

const getCities = vi.fn<() => Promise<City[]>>();

vi.mock("@/api/listingApi", () => ({
  getCities: () => getCities(),
  getSchools: vi.fn(),
  getWards: vi.fn(),
  getAmenities: vi.fn(),
}));

const HANOI: City = { id: 1, name: "Hà Nội", type: "city" } as City;

/** The hook keeps a module-level cache, so every test gets a fresh copy of it. */
async function freshHook() {
  vi.resetModules();
  return (await import("./useReferenceData")).useCities;
}

beforeEach(() => {
  getCities.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("useReferenceData", () => {
  it("loads once and exposes the rows", async () => {
    getCities.mockResolvedValue([HANOI]);
    const useCities = await freshHook();

    const { result } = renderHook(() => useCities());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual([HANOI]);
    expect(result.current.error).toBe(false);
  });

  it("shares one request between components mounted together", async () => {
    getCities.mockResolvedValue([HANOI]);
    const useCities = await freshHook();

    const a = renderHook(() => useCities());
    const b = renderHook(() => useCities());

    await waitFor(() => {
      expect(a.result.current.data).toEqual([HANOI]);
      expect(b.result.current.data).toEqual([HANOI]);
    });
    expect(getCities).toHaveBeenCalledTimes(1);
  });

  it("serves later mounts from the cache without a new request", async () => {
    getCities.mockResolvedValue([HANOI]);
    const useCities = await freshHook();

    const first = renderHook(() => useCities());
    await waitFor(() => {
      expect(first.result.current.loading).toBe(false);
    });

    const second = renderHook(() => useCities());
    expect(second.result.current.data).toEqual([HANOI]);
    expect(second.result.current.loading).toBe(false);
    expect(getCities).toHaveBeenCalledTimes(1);
  });

  it("reports a failure instead of silently returning an empty list", async () => {
    getCities.mockRejectedValue(new Error("network"));
    const useCities = await freshHook();

    const { result } = renderHook(() => useCities());

    await waitFor(() => {
      expect(result.current.error).toBe(true);
    });
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("does not cache a failure: reload tries again and recovers", async () => {
    getCities.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce([HANOI]);
    const useCities = await freshHook();

    const { result } = renderHook(() => useCities());
    await waitFor(() => {
      expect(result.current.error).toBe(true);
    });

    act(() => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([HANOI]);
    });
    expect(result.current.error).toBe(false);
    expect(getCities).toHaveBeenCalledTimes(2);
  });
});
