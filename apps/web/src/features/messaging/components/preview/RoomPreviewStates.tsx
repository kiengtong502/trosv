import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { ReactionBadge } from "@/features/messaging/components/ReactionBadge";

/** Placeholder shown while the room loads. */
export function RoomPreviewSkeleton({
  isMine,
  reactions,
}: {
  isMine: boolean;
  reactions: string[];
}) {
  return (
    <div className={cn("relative w-full", reactions.length > 0 ? "mb-2.5" : "")}>
      <div
        className={cn(
          "flex w-full max-w-[320px] items-center gap-3 rounded-xl border p-2.5",
          isMine ? "border-white/20 bg-white/10" : "border-line bg-tint/40",
        )}
      >
        <div className="size-16 animate-pulse rounded-lg bg-black/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-black/10" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-black/10" />
        </div>
      </div>
      {reactions.length > 0 ? <ReactionBadge reactions={reactions} isMine={isMine} /> : null}
    </div>
  );
}

/** Plain link shown when the room could not be loaded. */
export function RoomPreviewLink({
  roomId,
  isMine,
  reactions,
}: {
  roomId: number;
  isMine: boolean;
  reactions: string[];
}) {
  return (
    <div className={cn("relative inline-flex flex-col", reactions.length > 0 ? "mb-2.5" : "")}>
      <Link
        to={`/rooms/${roomId}`}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium underline hover:opacity-80 transition-opacity",
          isMine ? "text-white" : "text-plate",
        )}
      >
        <span>Xem thông tin phòng #{roomId}</span>
        <ExternalLink className="size-3" />
      </Link>
      {reactions.length > 0 ? <ReactionBadge reactions={reactions} isMine={isMine} /> : null}
    </div>
  );
}
