import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/ListingCardSkeleton";
import { Button } from "@/ui/button";
import { EmptyState, ErrorState } from "@/ui/empty-state";
import { SearchEmptyIllustration } from "@/ui/icons";
import type { Listing } from "@/types/api";

export interface ListingResultsProps {
  loading: boolean;
  error: string | null | undefined;
  listings: Listing[];
  onHover: (id: number | null) => void;
  onFavoriteToggle: (listing: Listing) => void;
  onResetFilters: () => void;
}

/** The result grid, or its loading skeleton, error or empty state. */
export function ListingResults({
  loading,
  error,
  listings,
  onHover,
  onFavoriteToggle,
  onResetFilters,
}: ListingResultsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
    <div className="motion-stagger grid grid-cols-1 gap-4 sm:grid-cols-2">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} onHover={onHover} onFavToggle={onFavoriteToggle} />
      ))}
    </div>
  );
}
