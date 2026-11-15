import { ListingCard } from "@/features/listings/components/ListingCard";
import { ListingCardSkeleton } from "@/features/listings/components/ListingCardSkeleton";
import { Button } from "@/shared/ui/button";
import { EmptyState, ErrorState } from "@/shared/ui/empty-state";
import { SearchEmptyIllustration } from "@/shared/ui/icons";
import type { Listing } from "@/shared/types/api";

export interface ListingResultsProps {
  loading: boolean;
  error: string | null | undefined;
  listings: Listing[];
  onHover: (id: number | null) => void;
  onFavoriteToggle: (listing: Listing) => void;
  onResetFilters: () => void;
  /** No map beside the list: use the full width with more columns. */
  wide?: boolean;
}

/** The result grid, or its loading skeleton, error or empty state. */
export function ListingResults({
  loading,
  error,
  listings,
  onHover,
  onFavoriteToggle,
  onResetFilters,
  wide = false,
}: ListingResultsProps) {
  const cols = wide
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    : "grid-cols-1 sm:grid-cols-2";
  if (loading) {
    return (
      <div className={`grid gap-4 ${cols}`}>
        <ListingCardSkeleton />
        <ListingCardSkeleton />
        <ListingCardSkeleton />
        <ListingCardSkeleton />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <ErrorState message={error} />
      </div>
    );
  }
  if (listings.length === 0) {
    return (
      <div>
        <EmptyState
          illustration={<SearchEmptyIllustration />}
          title="Chưa có phòng nào khớp bộ lọc"
          description="Thử nới khoảng giá hoặc chọn trường khác để xem thêm phòng."
          action={
            <Button variant="outline" onClick={onResetFilters}>
              Xóa bộ lọc
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <div className={`motion-stagger grid gap-4 ${cols}`}>
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} onHover={onHover} onFavToggle={onFavoriteToggle} />
      ))}
    </div>
  );
}
