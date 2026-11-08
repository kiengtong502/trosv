import { List as ListIcon, Map as MapIcon } from "lucide-react";
import { Input } from "@/ui/input";
import { PlateBand } from "@/ui/plate-band";
import { NearSchoolPill } from "./NearSchoolPill";
import { AmenitiesPill, AreaPill, PricePill, TypePill } from "./SimplePills";
import type { SearchState } from "./types";

export interface SearchFilterBarProps {
  search: SearchState;
  showMap: boolean;
  onToggleMap: () => void;
  onSaveSearch: () => void;
}

/** The navy strip under the header: search box and the filter pills. */
export function SearchFilterBar({
  search,
  showMap,
  onToggleMap,
  onSaveSearch,
}: SearchFilterBarProps) {
  return (
    <PlateBand
      size="strip"
      className="sticky top-14 z-20 min-[890px]:top-[72px] lg:z-10"
      contentClassName="gap-2 overflow-x-auto"
    >
      <Input
        value={search.filters.q}
        onChange={(e) => {
          search.setFilter("q", e.target.value);
        }}
        placeholder="Khu vực, trường hoặc đường..."
        aria-label="Tìm theo khu vực"
        className="h-10 min-w-52 max-w-80"
      />

      <AreaPill search={search} />
      <NearSchoolPill search={search} />
      <PricePill search={search} />
      <TypePill search={search} />
      <AmenitiesPill search={search} />

      <button
        type="button"
        onClick={onSaveSearch}
        className={
          "ml-auto h-9 flex-none rounded-lg px-3 text-sm font-medium text-white/85 " +
          "transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none " +
          "focus-visible:ring-2 focus-visible:ring-flyer"
        }
      >
        Lưu tìm kiếm
      </button>

      <button
        type="button"
        onClick={onToggleMap}
        className={
          "flex h-9 flex-none items-center gap-1.5 rounded-lg border border-flyer " +
          "bg-flyer px-3 text-sm font-semibold text-flyer-ink lg:hidden"
        }
        aria-pressed={showMap}
      >
        {showMap ? (
          <>
            <ListIcon className="size-4" aria-hidden /> Danh sách
          </>
        ) : (
          <>
            <MapIcon className="size-4" aria-hidden /> Bản đồ
          </>
        )}
      </button>
    </PlateBand>
  );
}
