import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/ui/button";
import { Avatar } from "@/ui/avatar";
import { Rating } from "@/ui/badge";
import { cn } from "@/lib/utils";
import type { Listing, Review } from "@/types/api";
import { PANEL } from "./panel";

function ratingRows(listing: Listing): [string, number | null | undefined][] {
  return [
    ["Phòng", listing.ratings?.listing_avg],
    ["Chủ nhà", listing.ratings?.landlord_avg],
    ["Khu vực", listing.ratings?.area_avg],
  ];
}

function RatingBars({ listing }: { listing: Listing }) {
  const rows = ratingRows(listing);
  if (!rows.some(([, v]) => v != null)) return null;
  return (
    <dl className="mb-4 grid gap-1.5 text-sm">
      {rows.map(([label, v]) => (
        <div key={label} className="flex items-center gap-3">
          <dt className="w-16 text-muted">{label}</dt>
          <dd className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
            <span
              className="block h-full rounded-full bg-flyer"
              style={{ width: `${((v ?? 0) / 5) * 100}%` }}
            />
          </dd>
          <dd className="w-8 text-right font-semibold tabular-nums text-ink">
            {v != null ? v.toFixed(1) : "–"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const name = review.student?.name ?? review.user_name ?? "Sinh viên";
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={name} avatar={review.student?.avatar} size={32} />
          <p className="truncate font-semibold text-ink">{name}</p>
        </div>
        <Rating value={review.listing_rating ?? review.rating} />
      </div>
      {review.comment ? (
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{review.comment}</p>
      ) : null}
    </div>
  );
}

export interface RoomReviewsProps {
  listing: Listing;
  reviews: Review[];
  /** The viewer is a student and may write a review. */
  canWrite: boolean;
}

export function RoomReviews({ listing, reviews, canWrite }: RoomReviewsProps) {
  return (
    <section className={cn(PANEL, listing.latitude == null && "lg:col-span-2")}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Đánh giá</h2>
        {canWrite ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={`${ROUTES.ROOM_DETAIL}?review=1`}>Viết đánh giá</Link>
          </Button>
        ) : null}
      </div>
      <RatingBars listing={listing} />
      {reviews.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">
          Chưa có đánh giá nào cho phòng này. Bạn từng ở đây? Hãy là người đầu tiên chia sẻ trải
          nghiệm.
        </p>
      ) : (
        <div className="divide-y divide-line">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}
