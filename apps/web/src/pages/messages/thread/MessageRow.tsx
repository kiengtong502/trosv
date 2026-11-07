import { cn } from "@/lib/utils";
import { MessageBubble } from "@/pages/messages/MessageBubble";
import type { Message } from "@/types/api";
import { DaySeparator, TimeSeparator } from "./ThreadSeparators";
import { formatDayLabel, type RowLayout } from "./threadLayout";

/** On opening a thread, only the last few messages ease in (one after another). */
export const OPEN_STAGGER_STEP_MS = 45;

export interface MessageRowProps {
  msg: Message;
  layout: RowLayout;
  /** Entrance animation: a message that arrived after the thread opened. */
  isNew: boolean;
  /** Position among the last messages shown when opening (staggered), or -1. */
  tailIndex: number;
  currentUserId: number | undefined;
  onReact: (m: Message, emoji: string) => void;
  onUnsend: (m: Message) => void;
  onDeleteSelf: (m: Message) => void;
}

export function MessageRow({
  msg,
  layout,
  isNew,
  tailIndex,
  currentUserId,
  onReact,
  onUnsend,
  onDeleteSelf,
}: MessageRowProps) {
  const spacing = layout.prevHasReactions ? "mt-3.5" : layout.groupedWithPrev ? "mt-0.5" : "mt-2";
  const animated = isNew || tailIndex >= 0;

  return (
    <div
      data-testid="message-row"
      className={cn("flex flex-col w-full", animated && "motion-enter")}
      style={
        tailIndex >= 0 ? { animationDelay: `${tailIndex * OPEN_STAGGER_STEP_MS}ms` } : undefined
      }
    >
      {layout.newDay ? <DaySeparator label={formatDayLabel(msg.created_at)} /> : null}
      {layout.showTimeGap ? <TimeSeparator date={msg.created_at} /> : null}
      <div className={cn("flex w-full", msg.is_mine ? "justify-end" : "justify-start", spacing)}>
        <MessageBubble
          msg={msg}
          isMine={msg.is_mine === true}
          grouped={layout.groupedWithPrev}
          shape={layout.shape}
          showTimestamp={layout.lastInCluster}
          currentUserId={currentUserId}
          onReact={onReact}
          onUnsend={onUnsend}
          onDeleteSelf={onDeleteSelf}
        />
      </div>
    </div>
  );
}
