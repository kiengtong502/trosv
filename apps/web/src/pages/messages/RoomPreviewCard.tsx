import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Home } from "lucide-react";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReactionBadge } from "@/pages/messages/ReactionBadge";
import type { Listing } from "@/types/api";
import { RoomPreviewLink, RoomPreviewSkeleton } from "./preview/RoomPreviewStates";
import { RoomReactButton } from "./preview/RoomReactButton";
import { roomLocationText, roomTypeLabel } from "./preview/roomPreview";
import { useRoomPreview } from "./preview/useRoomPreview";

export interface RoomPreviewCardProps {
  roomId: number;
  isMine?: boolean;
  reactions?: string[];
  myReaction?: string | null | undefined;
  onReact?: (emoji: string) => void;
}

function Thumbnail({ room }: { room: Listing }) {
  const coverUrl = room.cover_image ?? room.images?.[0]?.url;
  return (
    <div className="relative size-18 shrink-0 overflow-hidden rounded-lg bg-sunken">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={room.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted">
          <Home className="size-6" />
        </div>
      )}
    </div>
  );
}

export function RoomPreviewCard({
  roomId,
  isMine = false,
  reactions = [],
  myReaction = null,
  onReact,
}: RoomPreviewCardProps) {
  const { room, loading } = useRoomPreview(roomId);
  const [reactOpen, setReactOpen] = useState(false);

  if (loading) return <RoomPreviewSkeleton isMine={isMine} reactions={reactions} />;
  if (!room) return <RoomPreviewLink roomId={roomId} isMine={isMine} reactions={reactions} />;

  const location = roomLocationText(room);

  return (
    <div className={cn("relative w-full group/card", reactions.length > 0 ? "mb-2.5" : "")}>
      <Link
        to={`/rooms/${roomId}`}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-line-strong/30 bg-card p-2.5",
          "shadow-xs transition hover:border-plate/50 hover:shadow-md text-left",
        )}
      >
        <Thumbnail room={room} />

        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch py-0.5">
          <div>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 text-[11px] font-medium text-muted">
                <span>{roomTypeLabel(room.type)}</span>
                {room.area_m2 ? (
                  <>
                    <span>•</span>
                    <span>{room.area_m2} m²</span>
                  </>
                ) : null}
              </div>
              {onReact ? (
                <RoomReactButton
                  open={reactOpen}
                  onOpenChange={setReactOpen}
                  isMine={isMine}
                  myReaction={myReaction}
                  onReact={onReact}
                />
              ) : null}
            </div>

            <h4 className="mt-0.5 line-clamp-1 text-xs font-semibold text-ink group-hover:text-plate transition-colors">
              {room.title}
            </h4>
            {location ? <p className="text-[11px] text-muted truncate">{location}</p> : null}
          </div>

          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-xs font-bold text-plate tabular-nums">
              {formatVnd(room.price)}/tháng
            </span>
            <span className="text-[10px] text-muted group-hover:text-plate flex items-center gap-0.5 font-medium shrink-0">
              Xem chi tiết
              <ExternalLink className="size-2.5" />
            </span>
          </div>
        </div>
      </Link>

      {reactions.length > 0 ? (
        <ReactionBadge
          reactions={reactions}
          isMine={isMine}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setReactOpen((prev) => !prev);
          }}
        />
      ) : null}
    </div>
  );
}
