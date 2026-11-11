import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { ROUTES, route } from "@/shared/constants/routes";

/*
  Pinned at the top of a thread. A conversation only remembers the LATEST room
  asked about (earlier rooms appear in the history as room-link cards), so this
  card says "Phòng gần nhất" rather than claiming to be the only room.
*/
export function ThreadRoomCard({
  listing,
}: {
  listing: { id: number; title: string; cover_image?: string | null };
}) {
  return (
    <div
      data-testid="thread-room-card"
      className="motion-enter mx-auto mb-3 flex w-full max-w-md items-center gap-3 rounded-xl border border-line bg-card p-2.5 shadow-card transition-[transform,box-shadow] duration-200 hover:shadow-card-hover hover:[transform:translateY(-2px)]"
    >
      {listing.cover_image ? (
        <img
          src={listing.cover_image}
          alt=""
          width={84}
          height={64}
          className="h-16 w-[84px] flex-none rounded-lg bg-sunken object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-16 w-[84px] flex-none items-center justify-center rounded-lg bg-tint text-muted"
        >
          <Home className="size-6" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Phòng gần nhất</p>
        <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-ink">
          {listing.title}
        </p>
      </div>
      <Link
        to={route(ROUTES.ROOM_DETAIL, { id: listing.id })}
        className="flex-none whitespace-nowrap rounded-md px-1 text-sm font-semibold text-plate hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
      >
        Xem phòng →
      </Link>
    </div>
  );
}
