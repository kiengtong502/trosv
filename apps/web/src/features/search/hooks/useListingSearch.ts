import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getListings } from "@/features/listings/api/listingApi";
import {
  useAmenities,
  useCities,
  useSchools,
  useWards,
} from "@/features/listings/hooks/useReferenceData";
import { errMessage } from "@/shared/api/axiosClient";
import { toggleId } from "@/shared/lib/list";
import type { Listing, PaginationMeta } from "@/shared/types/api";
import {
  EMPTY_FILTERS,
  MAP_PAGE_SIZE,
  filtersFromParams,
  filtersToApiParams,
  filtersToUrlParams,
  withCity,
  withFilter,
  withWard,
  type ListingFilters,
} from "../lib/searchFilters";

/**
 * Listing search for the /rooms page: filter state, reference data
 * (cities/wards/schools/amenities), debounced fetch with URL-sync for
 * q/type, and cascade-aware filter setters (city change resets ward/
 * school/radius). Pagination state rides along so filter changes reset
 * to page 1.
 */
export function useListingSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: cities } = useCities();
  const { data: wards } = useWards();
  const { data: schools } = useSchools();
  const { data: amenities } = useAmenities();
  const [schoolQuery, setSchoolQuery] = useState("");

  const [storedFilters, setFilters] = useState<ListingFilters>(() =>
    filtersFromParams(searchParams),
  );
  const filters = useMemo(
    () => ({ ...storedFilters, city_id: String(cities[0]?.id ?? "") }),
    [storedFilters, cities],
  );
  const [page, setPage] = useState(1);
  const selectedSchool = schools.find((school) => String(school.id) === filters.school_id) ?? null;
  const [listings, setListings] = useState<Listing[]>([]);
  const [mapListings, setMapListings] = useState<Listing[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const prevParamsStringRef = useRef(searchParams.toString());
  const latestRequestRef = useRef(0);

  // Sync state if searchParams change externally (e.g. navigation / back / direct link)
  const currentParamsString = searchParams.toString();
  useEffect(() => {
    if (currentParamsString !== prevParamsStringRef.current) {
      prevParamsStringRef.current = currentParamsString;
      setFilters(filtersFromParams(searchParams));
      setSchoolQuery("");
      setPage(1);
    }
  }, [currentParamsString, searchParams]);

  // Build query from filters and fetch.
  const fetchListings = useCallback(
    async (currentPage: number, request: number) => {
      setLoading(true);
      setError("");
      const params = filtersToApiParams(filters, currentPage);

      try {
        const mapParams = filtersToApiParams(filters, 1, MAP_PAGE_SIZE);
        const [pagedRes, mapRes] = await Promise.all([getListings(params), getListings(mapParams)]);
        if (request !== latestRequestRef.current) return;
        setListings(pagedRes.data);
        setMeta(pagedRes.meta);
        setMapListings(mapRes.data);
      } catch (err) {
        if (request !== latestRequestRef.current) return;
        setError(errMessage(err));
        setListings([]);
        setMapListings([]);
        setMeta(null);
      } finally {
        if (request === latestRequestRef.current) setLoading(false);
      }
    },
    [filters],
  );

  // Refetch whenever filters change (debounced) or page changes.
  useEffect(() => {
    const request = ++latestRequestRef.current;
    const t = setTimeout(() => {
      void fetchListings(page, request);
      const next = filtersToUrlParams(filters);
      const nextString = new URLSearchParams(next).toString();
      // Only touch the URL when it actually differs (so first load never rewrites it,
      // while a change made before the first debounce still lands).
      if (nextString !== prevParamsStringRef.current) {
        prevParamsStringRef.current = nextString;
        setSearchParams(next, { replace: true });
      }
    }, 300);
    return () => {
      clearTimeout(t);
      // Invalidate in-flight results immediately, including the next debounce window.
      latestRequestRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const setFilter = (key: keyof ListingFilters, value: string): void => {
    if (key === "school_id") setSchoolQuery("");
    setPage(1);
    setFilters((f) => withFilter(f, key, value));
  };

  // Another city: ward, school and radius reset so the cascade stays valid.
  const setCity = (cityId: string): void => {
    setSchoolQuery("");
    setPage(1);
    setFilters((f) => withCity(f, cityId));
  };

  // Choosing a room's ward must preserve the selected school and radius.
  const setWard = (wardId: string): void => {
    setPage(1);
    setFilters((f) => withWard(f, wardId));
  };

  const toggleAmenity = (id: number): void => {
    setPage(1);
    setFilters((f) => ({ ...f, amenity_ids: toggleId(f.amenity_ids, id) }));
  };

  const resetFilters = (): void => {
    setSchoolQuery("");
    setPage(1);
    setFilters({ ...EMPTY_FILTERS });
  };

  return {
    // reference data
    cities,
    wards,
    schools,
    selectedSchool,
    schoolQuery,
    setSchoolQuery,
    amenities,
    // search state
    filters,
    setFilter,
    setCity,
    setWard,
    toggleAmenity,
    resetFilters,
    // results
    listings,
    mapListings,
    setListings,
    meta,
    loading,
    error,
    page,
    setPage,
  };
}
