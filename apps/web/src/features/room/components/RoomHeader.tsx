import { Heart, MapPin, Share2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Rating, Tag } from "@/shared/ui/badge";
import { TYPE_LABELS } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { Listing } from "@/shared/types/api";

export interface RoomHeaderProps {
  listing: Listing;
  /** Fallback review count when the listing does not carry one. */
  reviewCount: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCopyLink: () => void;
}

function RoomTags({ listing }: { listing: Listing }) {
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      <Tag variant="paper">{TYPE_LABELS[listing.type ?? ""] ?? "Phòng trọ"}</Tag>
      {listing.status === "available" ? (
        <Tag className="bg-moss-tint text-moss">Còn trống</Tag>
      ) : null}
    </div>
  );
}

function RoomAddress({ listing }: { listing: Listing }) {
  const ward =
    listing.ward && !listing.address.includes(listing.ward.name) ? listing.ward.name : "";
  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
      <MapPin className="size-4 text-plate" aria-hidden />
      <span>
        {listing.address}
        {ward ? `, ${ward}` : ""}
      </span>
    </p>
  );
}

function RoomRatingLine({ listing, reviewCount }: { listing: Listing; reviewCount: number }) {
  const rated =
    listing.ratings?.listing_avg ?? listing.average_rating ?? listing.avg_rating ?? null;
  if (rated == null) return null;
  return (
    <p className="mt-1.5 text-sm text-ink-2">
      <Rating value={rated} />
      <span className="ml-1 text-muted">· {listing.reviews_count ?? reviewCount} đánh giá</span>
    </p>
  );
}

function RoomActions({
  isFavorite,
  onToggleFavorite,
  onCopyLink,
}: Pick<RoomHeaderProps, "isFavorite" | "onToggleFavorite" | "onCopyLink">) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleFavorite}
        aria-pressed={isFavorite}
        className={cn(
          isFavorite && "border-danger/30 text-danger hover:bg-danger-tint hover:text-danger",
        )}
      >
        <Heart className={cn("size-4", isFavorite && "fill-danger")} aria-hidden />
        {isFavorite ? "Đã lưu" : "Lưu"}
      </Button>
      <Button variant="outline" size="sm" onClick={onCopyLink}>
        <Share2 className="size-4" aria-hidden />
        Chia sẻ
      </Button>
    </div>
  );
}

/** Type and status tags, title, address, rating, and the save/share buttons. */
export function RoomHeader({
  listing,
  reviewCount,
  isFavorite,
  onToggleFavorite,
  onCopyLink,
}: RoomHeaderProps) {
  return (
    <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <RoomTags listing={listing} />
        <h1 className="text-2xl font-extrabold tracking-tight text-ink lg:text-3xl">
          {listing.title}
        </h1>
        <RoomAddress listing={listing} />
        <RoomRatingLine listing={listing} reviewCount={reviewCount} />
      </div>
      <RoomActions
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onCopyLink={onCopyLink}
      />
    </div>
  );
}
