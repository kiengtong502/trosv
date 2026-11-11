import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { ROUTES, route } from "@/shared/constants/routes";
import type { Conversation } from "@/shared/types/api";
import { Avatar } from "@/shared/ui/avatar";
import { timeAgo } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { describeConversation } from "../lib/conversationRow";

function UnreadBadge({ count }: { count: number }) {
  return (
    <span
      data-testid="unread-badge"
      className="flex h-5 min-w-5 flex-none animate-pop-in items-center justify-center rounded-full bg-plate px-1.5 text-[11.5px] font-bold text-white"
    >
      {count}
    </span>
  );
}

function RoomChip({ title }: { title: string }) {
  return (
    <span
      data-testid="conversation-room"
      className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-line bg-card px-2 py-0.5 text-[11.5px] text-ink-2"
    >
      <Home className="size-3 flex-none" aria-hidden />
      <span className="truncate">{title}</span>
    </span>
  );
}

/*
  One row of the conversation list. Unread rows are bold with a count badge,
  your own last message is prefixed "Bạn:", and a chip names the room the
  chat is currently about (a conversation only remembers the latest room).
*/
export function ConversationListItem({
  conversation: c,
  active,
  viewerId,
}: {
  conversation: Conversation;
  active: boolean;
  viewerId: number | undefined;
}) {
  const { name, unread, preview, lastAt } = describeConversation(c, viewerId);
  const hasUnread = unread > 0;

  return (
    <Link
      to={route(ROUTES.CONVERSATION, { id: c.id })}
      data-testid={`conversation-${c.id}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex gap-3 rounded-xl p-3 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate",
        active ? "bg-tint" : "hover:bg-tint/70",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute -left-2.5 bottom-3 top-3 w-[3px] rounded-r bg-plate"
        />
      ) : null}
      <Avatar name={name} avatar={c.other_user?.avatar} size={46} className="flex-none" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            data-testid="conversation-name"
            className={cn(
              "truncate text-[15px] text-ink",
              hasUnread ? "font-extrabold" : "font-semibold",
            )}
          >
            {name}
          </p>
          <span
            className={cn(
              "flex-none text-xs tabular-nums",
              hasUnread ? "font-bold text-plate" : "text-muted",
            )}
          >
            {lastAt ? timeAgo(lastAt) : ""}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              hasUnread ? "font-semibold text-ink" : "text-muted",
            )}
          >
            {preview}
          </p>
          {hasUnread ? <UnreadBadge count={unread} /> : null}
        </div>
        {c.listing ? <RoomChip title={c.listing.title} /> : null}
      </div>
    </Link>
  );
}
