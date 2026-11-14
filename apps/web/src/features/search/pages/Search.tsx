import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, route } from "@/shared/constants/routes";
import { useListingSearch } from "@/features/search/hooks/useListingSearch";
import { ListingMap } from "@/features/listings/components/ListingMap";
import { cn } from "@/shared/lib/utils";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { ActiveChips } from "../components/ActiveChips";
import { ListingResults } from "../components/ListingResults";
import { MobileViewToggle, type MobileTab } from "../components/MobileViewToggle";
import { Pagination } from "../components/Pagination";
import { SearchFilterBar } from "../components/SearchFilterBar";
import { SortMenu } from "../components/SortMenu";
import { areaName, buildFilterChips } from "../lib/filterChips";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";

export default function Search() {
  const navigate = useNavigate();
  useDocumentTitle("Tìm phòng · TROSV");
  const search = useListingSearch();
  const [mobileTab, setMobileTab] = useState<MobileTab>("list");
  const [hoveredListing, setHoveredListing] = useState<number | null>(null);
  const toggleFavorite = useFavoriteToggle(search.setListings);
  const toggleMobileTab = () => {
    setMobileTab((t) => (t === "list" ? "map" : "list"));
  };

  const chips = useMemo(
    () => buildFilterChips(search.filters, search, search).filter((chip) => chip.key !== "city_id"),
    [search],
  );
  const onHover = useCallback((id: number | null) => {
    setHoveredListing(id);
  }, []);
  const totalCount = search.meta?.total ?? search.listings.length;
  const area = areaName(search.filters, search);

  return (
    <div className="flex min-h-[calc(100svh-var(--nav-h))] flex-col bg-paper">
      {/* Sticky top filter bar */}
      <SearchFilterBar
        search={search}
        showMap={mobileTab === "map"}
        onToggleMap={toggleMobileTab}
      />

      {/* Result metadata + Active filter chips */}
      <div className="border-b border-line bg-paper/50 px-4 py-2.5 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p aria-live="polite" className="text-sm font-semibold text-ink">
            {search.loading ? (
              <span className="text-muted">Đang tìm phòng…</span>
            ) : (
              <>
                <span className="tabular-nums">{totalCount}</span> phòng trọ
                {area ? <span className="font-normal text-muted"> tại {area}</span> : null}
              </>
            )}
          </p>
          <SortMenu
            sort={search.filters.sort}
            onChange={(sort) => {
              search.setFilter("sort", sort);
            }}
          />
        </div>
        <ActiveChips chips={chips} />
      </div>

      {/* Split view: List | Map (Responsive Desktop Split + Mobile Tab) */}
      <div className="flex flex-1 flex-col pt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,50%)]">
        {/* Listings column: Always on desktop, conditional on mobile */}
        <div
          data-testid="list-pane"
          className={cn(
            "animate-fade-in px-4 pb-20 lg:order-2 lg:animate-none lg:px-6 lg:pb-16",
            mobileTab === "map" ? "hidden lg:block" : "block",
          )}
        >
          <ListingResults
            loading={search.loading}
            error={search.error}
            listings={search.listings}
            onHover={onHover}
            onFavoriteToggle={(l) => {
              void toggleFavorite(l);
            }}
            onResetFilters={search.resetFilters}
          />
          <Pagination
            page={search.page}
            lastPage={search.meta?.last_page ?? 0}
            onPage={search.setPage}
          />
        </div>

        {/* Map column: Always on desktop, conditional on mobile */}
        <div
          data-testid="map-pane"
          className={cn(
            "animate-fade-in lg:animate-none lg:order-1 lg:block",
            mobileTab === "map"
              ? "block h-[calc(100dvh-var(--nav-h)-115px)] w-full"
              : "hidden lg:block",
          )}
        >
          <div
            className={
              "h-full w-full lg:sticky lg:top-[calc(var(--nav-h)+55px)] " +
              "lg:h-[calc(100vh-var(--nav-h)-55px)]"
            }
          >
            <ListingMap
              school={search.selectedSchool}
              radiusKm={Number(search.filters.max_km)}
              listings={search.mapListings.length > 0 ? search.mapListings : search.listings}
              selectedId={hoveredListing}
              onSelect={(id) => {
                void navigate(route(ROUTES.ROOM_DETAIL, { id }));
              }}
              onHover={onHover}
              hasLocationFilter={Boolean(
                search.filters.city_id || search.filters.ward_id || search.filters.school_id,
              )}
              ariaLabel="Bản đồ phòng trọ"
            />
          </div>
        </div>
      </div>

      <MobileViewToggle tab={mobileTab} onToggle={toggleMobileTab} />
    </div>
  );
}
