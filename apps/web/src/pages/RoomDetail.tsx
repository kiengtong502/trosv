import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useRoomDetail } from "@/hooks/useRoomDetail";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { RoomContactCard } from "./room/RoomContactCard";
import { RoomDescription } from "./room/RoomDescription";
import { RoomFactTiles } from "./room/RoomFactTiles";
import { RoomGallery, galleryImagesFor } from "./room/RoomGallery";
import { RoomHeader } from "./room/RoomHeader";
import { RoomLightbox } from "./room/RoomLightbox";
import { RoomLoadError } from "./room/RoomLoadError";
import { RoomLocation } from "./room/RoomLocation";
import { RoomMobileBar } from "./room/RoomMobileBar";
import { RoomPriceAdvice } from "./room/RoomPriceAdvice";
import { RoomReviews } from "./room/RoomReviews";
import { RoomSkeleton } from "./room/RoomSkeleton";
import { SimilarRooms } from "./room/SimilarRooms";
import { useRoomActions } from "./room/useRoomActions";

/** Room page: loads the listing, then lays out the bento sections in `./room/*`. */
export default function RoomDetail() {
  const id = Number(useParams().id);
  const detail = useRoomDetail(id);
  const { user } = useAuth();
  const [now] = useState(() => Date.now());
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);
  const { isFavorite, toggleFavorite, copyLink } = useRoomActions(
    detail.listing,
    detail.setListing,
  );

  useDocumentTitle(detail.listing ? `${detail.listing.title} · TROSV` : "Chi tiết phòng · TROSV");

  if (detail.loading) return <RoomSkeleton />;

  if (detail.error) return <RoomLoadError message={detail.error} />;

  const listing = detail.listing;
  if (!listing) return null;

  const images = listing.images ?? [];
  const canWrite = Boolean(listing.can_review) && user?.role === "student";

  return (
    <div className="mx-auto max-w-6xl p-4 pb-28 lg:p-6 lg:pb-10">
      <Link
        to={ROUTES.ROOMS}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-plate"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại kết quả tìm kiếm
      </Link>

      <RoomHeader
        listing={listing}
        reviewCount={detail.reviews.length}
        isFavorite={isFavorite}
        onToggleFavorite={() => void toggleFavorite()}
        onCopyLink={copyLink}
      />

      <div className="motion-stagger mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <RoomGallery images={galleryImagesFor(listing)} onOpen={setLightboxAt} />
        <div className="flex flex-col gap-4">
          <RoomContactCard listing={listing} />
          <RoomPriceAdvice listingId={id} />
        </div>
      </div>

      <RoomFactTiles listing={listing} now={now} />
      <RoomDescription listing={listing} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[5fr_7fr]">
        <RoomLocation listing={listing} />
        <RoomReviews listing={listing} reviews={detail.reviews} canWrite={canWrite} />
      </div>

      <SimilarRooms listing={listing} />
      <div data-testid="room-end" aria-hidden />

      <RoomMobileBar price={listing.price} />

      {lightboxAt != null && images.length > 0 ? (
        <RoomLightbox
          images={images}
          index={lightboxAt}
          onClose={() => {
            setLightboxAt(null);
          }}
          onNavigate={setLightboxAt}
        />
      ) : null}
    </div>
  );
}
