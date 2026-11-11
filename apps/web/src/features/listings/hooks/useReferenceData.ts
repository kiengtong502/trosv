import { useCallback, useEffect, useState } from "react";
import { getAmenities, getCities, getSchools, getWards } from "@/features/listings/api/listingApi";
import type { Amenity, City, School, Ward } from "@/shared/types/api";

/*
  Reference data (cities, wards, schools, amenities) barely changes, and four
  pages used to fetch it on their own and swallow failures. Now there is one
  fetch per kind per page load, shared by every consumer, and a failure is
  reported (`error`) and can be retried (`reload`) instead of silently
  producing an empty list.
*/

export interface ReferenceData<T> {
  data: T[];
  loading: boolean;
  /** True when the last load failed; `data` is then empty. */
  error: boolean;
  /** Try again after a failure. */
  reload: () => void;
}

function createReferenceHook<T>(name: string, load: () => Promise<T[]>): () => ReferenceData<T> {
  let cached: T[] | null = null;
  let inflight: Promise<T[]> | null = null;

  function fetchOnce(): Promise<T[]> {
    if (cached) return Promise.resolve(cached);
    inflight ??= load()
      .then((rows) => {
        cached = rows;
        return rows;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  }

  return function useReference(): ReferenceData<T> {
    const [data, setData] = useState<T[]>(cached ?? []);
    const [loading, setLoading] = useState(cached === null);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
      let live = true;
      fetchOnce()
        .then((rows) => {
          if (!live) return;
          setData(rows);
          setError(false);
        })
        .catch((e: unknown) => {
          console.error(`Could not load ${name}`, e);
          if (live) setError(true);
        })
        .finally(() => {
          if (live) setLoading(false);
        });
      return () => {
        live = false;
      };
    }, [attempt]);

    const reload = useCallback(() => {
      setLoading(true);
      setAttempt((n) => n + 1);
    }, []);

    return { data, loading, error, reload };
  };
}

export const useCities = createReferenceHook<City>("cities", () => getCities());
export const useSchools = createReferenceHook<School>("schools", () => getSchools());
export const useWards = createReferenceHook<Ward>("wards", () => getWards());
export const useAmenities = createReferenceHook<Amenity>("amenities", () => getAmenities());
