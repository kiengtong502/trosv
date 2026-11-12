import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { useRoomDetail } from "@/features/room/hooks/useRoomDetail";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { RoomContactCard } from "../components/RoomContactCard";
import { RoomDescription } from "../components/RoomDescription";
import { RoomFactTiles } from "../components/RoomFactTiles";
import { RoomGallery, galleryImagesFor } from "../components/RoomGallery";
import { RoomHeader } from "../components/RoomHeader";
import { RoomLightbox } from "../components/RoomLightbox";
import { RoomLoadError } from "../components/RoomLoadError";
import { RoomLocation } from "../components/RoomLocation";
import { RoomMobileBar } from "../components/RoomMobileBar";
import { RoomPriceAdvice } from "../components/RoomPriceAdvice";
import { RoomReviews } from "../components/RoomReviews";
import { ReviewDialog } from "../components/ReviewDialog";
import { RoomSkeleton } from "../components/RoomSkeleton";
import { SimilarRooms } from "../components/SimilarRooms";
import { useRoomActions } from "../hooks/useRoomActions";

/** Room page: loads the listing, then lays out the bento sections in `./room/*`. */
export default function RoomDetail() {
  const id = Number(useParams().id);
  const detail = useRoomDetail(id);
  const { user } = useAuth();
  const [now] = useState(() => Date.now());
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
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
  // The URL is the dialog's state (?review=1): deep links, Back and Escape all just work.
  const reviewOpen = canWrite && searchParams.get("review") === "1";
  const closeReview = (): void => {
    setSearchParams(
      (params) => {
        params.delete("review");
        return params;
      },
      { replace: true },
    );
  };

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
        <RoomReviews
          listing={listing}
          reviews={detail.reviews}
          canWrite={canWrite}
          isStudent={user?.role === "student"}
        />
      </div>

      <SimilarRooms listing={listing} />
      <div data-testid="room-end" aria-hidden />

      <RoomMobileBar price={listing.price} />

      <ReviewDialog
        listing={listing}
        open={reviewOpen}
        onClose={closeReview}
        onSubmitted={() => {
          closeReview();
          detail.refresh();
        }}
      />

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
