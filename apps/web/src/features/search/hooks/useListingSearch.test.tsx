import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Listing, Paged } from "@/shared/types/api";
import { useListingSearch } from "./useListingSearch";

const mocks = vi.hoisted(() => ({
  getListings: vi.fn(),
  setSearchParams: vi.fn(),
  params: new URLSearchParams(),
  cities: [{ id: 3, name: "TP.HCM" }],
  empty: [],
}));
vi.mock("react-router-dom", () => ({
  useSearchParams: () => [mocks.params, mocks.setSearchParams],
}));
vi.mock("@/features/listings/api/listingApi", () => ({ getListings: mocks.getListings }));
vi.mock("@/features/listings/hooks/useReferenceData", () => ({
  useCities: () => ({ data: mocks.cities }),
  useWards: () => ({ data: mocks.empty }),
  useSchools: () => ({ data: mocks.empty }),
  useAmenities: () => ({ data: mocks.empty }),
}));
vi.mock("@/shared/api/axiosClient", () => ({
  errMessage: (error: Error) => error.message,
}));

beforeEach(() => {
  vi.useFakeTimers();
  mocks.getListings.mockReset();
  mocks.setSearchParams.mockReset();
  mocks.params = new URLSearchParams();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function deferred() {
  let resolve!: (value: Paged<Listing>) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Paged<Listing>>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
const response = (id: number, page = 1): Paged<Listing> => ({
  data: [{ id, title: `Room ${String(id)}` }] as Listing[],
  meta: { current_page: page, last_page: 3, total: 30, per_page: 12 },
});
function batch() {
  const paged = deferred();
  const map = deferred();
  mocks.getListings.mockReturnValueOnce(paged.promise).mockReturnValueOnce(map.promise);
  return { paged, map };
}
async function startRequest() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

for (const change of ["ward", "page"] as const) {
  it(`ignores an older success after the latest ${change} response for both list and map`, async () => {
    const old = batch();
    const latest = batch();
    const { result } = renderHook(() => useListingSearch());
    await startRequest();
    act(() => {
      if (change === "ward") result.current.setWard("42");
      else result.current.setPage(2);
    });
    await startRequest();
    await act(async () => {
      latest.map.resolve(response(200));
      latest.paged.resolve(response(20, 2));
      await Promise.all([latest.map.promise, latest.paged.promise]);
    });
    expect(result.current.listings[0]?.id).toBe(20);
    expect(result.current.mapListings[0]?.id).toBe(200);
    expect(result.current.meta?.current_page).toBe(2);
    await act(async () => {
      old.paged.resolve(response(10));
      old.map.resolve(response(100));
      await Promise.all([old.paged.promise, old.map.promise]);
    });
    expect(result.current.listings[0]?.id).toBe(20);
    expect(result.current.mapListings[0]?.id).toBe(200);
    expect(result.current.meta?.current_page).toBe(2);
    expect(result.current.error).toBe("");
    expect(result.current.loading).toBe(false);
  });
}

it("invalidates the old response during the next filter's debounce window", async () => {
  const old = batch();
  const latest = batch();
  const { result } = renderHook(() => useListingSearch());
  await startRequest();
  act(() => {
    result.current.setWard("42");
  });
  await act(async () => {
    old.paged.resolve(response(10));
    old.map.resolve(response(100));
    await Promise.all([old.paged.promise, old.map.promise]);
  });
  expect(mocks.getListings).toHaveBeenCalledTimes(2);
  expect(result.current.listings).toEqual([]);
  expect(result.current.mapListings).toEqual([]);
  expect(result.current.meta).toBeNull();
  expect(result.current.loading).toBe(true);
  await startRequest();
  await act(async () => {
    latest.paged.resolve(response(20));
    latest.map.resolve(response(200));
    await Promise.all([latest.paged.promise, latest.map.promise]);
  });
  expect(result.current.listings[0]?.id).toBe(20);
});

it("ignores stale failures without clearing newer results or finishing their loading state", async () => {
  const old = batch();
  const latest = batch();
  const { result } = renderHook(() => useListingSearch());
  await startRequest();
  act(() => {
    result.current.setWard("42");
  });
  await startRequest();
  await act(async () => {
    old.paged.reject(new Error("Old request failed"));
    old.map.resolve(response(100));
    await Promise.allSettled([old.paged.promise, old.map.promise]);
  });
  expect(result.current.error).toBe("");
  expect(result.current.loading).toBe(true);
  await act(async () => {
    latest.paged.resolve(response(20));
    latest.map.resolve(response(200));
    await Promise.all([latest.paged.promise, latest.map.promise]);
  });
  expect(result.current.listings[0]?.id).toBe(20);
  expect(result.current.mapListings[0]?.id).toBe(200);
  expect(result.current.error).toBe("");
});

it("clears the latest results and pagination when the latest request fails", async () => {
  const old = batch();
  const latest = batch();
  const { result } = renderHook(() => useListingSearch());
  await startRequest();
  await act(async () => {
    old.paged.resolve(response(10));
    old.map.resolve(response(100));
    await Promise.all([old.paged.promise, old.map.promise]);
  });
  act(() => {
    result.current.setWard("42");
  });
  await startRequest();
  await act(async () => {
    latest.paged.resolve(response(20));
    latest.map.reject(new Error("Latest map failed"));
    await Promise.allSettled([latest.paged.promise, latest.map.promise]);
  });
  expect(result.current.error).toBe("Latest map failed");
  expect(result.current.listings).toEqual([]);
  expect(result.current.mapListings).toEqual([]);
  expect(result.current.meta).toBeNull();
  expect(result.current.loading).toBe(false);
});
