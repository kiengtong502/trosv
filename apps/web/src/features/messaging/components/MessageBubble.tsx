import { useState } from "react";
import type { Message } from "@/shared/types/api";
import { cn } from "@/shared/lib/utils";
import { RoomPreviewCard } from "@/features/messaging/components/RoomPreviewCard";
import { ReactionBadge } from "@/features/messaging/components/ReactionBadge";
import { BodyWithLinks } from "./bubble/BodyWithLinks";
import { BubbleAttachment } from "./bubble/BubbleAttachment";
import { BubbleMenu } from "./bubble/BubbleMenu";
import { describeMessage, isImageAttachment } from "./bubble/messageContent";

import type { BubbleShape } from "./thread/threadLayout";

export type { BubbleShape };

export interface MessageBubbleProps {
  msg: Message;
  isMine: boolean;
  grouped: boolean;
  shape?: BubbleShape;
  showTimestamp?: boolean;
  onReact: (m: Message, emoji: string) => void;
  onUnsend: (m: Message) => void;
  onDeleteSelf: (m: Message) => void;
  currentUserId?: number | undefined;
}

function UnsentBubble({ isMine }: { isMine: boolean }) {
  return (
    <div className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "rounded-xl border border-dashed border-line bg-tint/50 px-3.5 py-2 text-xs italic text-muted",
          isMine ? "text-right" : "text-left",
        )}
      >
        Tin nhắn đã được thu hồi
      </p>
    </div>
  );
}

function TextBubble({
  text,
  isMine,
  reactions,
  onOpenReactions,
}: {
  text: string;
  isMine: boolean;
  /** Reactions hanging on this bubble (empty when another element carries them). */
  reactions: string[];
  onOpenReactions: () => void;
}) {
  const hasBadge = reactions.length > 0;
  return (
    <div
      className={cn(
        "relative px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words",
        "text-left shadow-xs transition-all rounded-xl",
        hasBadge ? "mb-2.5" : "",
        isMine
          ? "bg-bubble text-white font-normal"
          : "bg-card text-ink border border-line shadow-card",
      )}
    >
      <BodyWithLinks text={text} />
      {hasBadge ? (
        <ReactionBadge reactions={reactions} isMine={isMine} onClick={onOpenReactions} />
      ) : null}
    </div>
  );
}

function Timestamp({
  time,
  isMine,
  seen,
  hasReactions,
}: {
  time: string;
  isMine: boolean;
  seen: boolean;
  hasReactions: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted",
        "transition-opacity duration-150 animate-fade-in",
        hasReactions ? "mt-2 pt-0.5" : "",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      <span>{time}</span>
      {isMine && seen ? <span className="font-medium text-plate">· Đã xem</span> : null}
    </div>
  );
}

export function MessageBubble(props: MessageBubbleProps) {
  const {
    msg,
    isMine,
    showTimestamp = true,
    onReact,
    onUnsend,
    onDeleteSelf,
    currentUserId,
  } = props;
  const [open, setOpen] = useState(false);
  // null = follow the default; a click on the bubble pins it shown/hidden.
  const [pinnedShowTime, setPinnedShowTime] = useState<boolean | null>(null);

  if (msg.is_unsent) return <UnsentBubble isMine={isMine} />;

  const isTimeVisible = pinnedShowTime ?? showTimestamp;
  const { reactions, myReaction, attachmentUrl, roomId, text, time, fullTime, badgeTarget } =
    describeMessage(msg, currentUserId);
  const reactionsFor = (target: typeof badgeTarget) => (badgeTarget === target ? reactions : []);
  const openReactions = () => {
    setOpen(true);
  };

  const handleBubbleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, textarea")) return;
    setPinnedShowTime((prev) => (prev !== null ? !prev : !showTimestamp));
  };

  const menu = (align: "start" | "end") => (
    <BubbleMenu
      msg={msg}
      isMine={isMine}
      align={align}
      open={open}
      onOpenChange={setOpen}
      myReaction={myReaction}
      onReact={onReact}
      onUnsend={onUnsend}
      onDeleteSelf={onDeleteSelf}
    />
  );

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-[82%] sm:max-w-[72%]",
        isMine ? "items-end ml-auto" : "items-start mr-auto",
      )}
    >
      <div
        className={cn(
          "group/msg flex items-center gap-1.5 w-full",
          isMine ? "justify-end" : "justify-start",
        )}
      >
        {/* Sender: menu on the left of the bubble, panel opens rightward over it. */}
        {isMine ? menu("start") : null}

        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          onClick={handleBubbleClick}
          title={fullTime}
          className={cn(
            "flex flex-col max-w-full cursor-pointer select-text",
            isMine ? "items-end" : "items-start",
          )}
        >
          {attachmentUrl ? (
            <BubbleAttachment
              url={attachmentUrl}
              name={msg.attachment_name}
              isImage={isImageAttachment(msg.attachment_name, attachmentUrl, msg.attachment_type)}
              isMine={isMine}
              reactions={reactionsFor("attachment")}
              onOpenReactions={openReactions}
            />
          ) : null}

          {text ? (
            <TextBubble
              text={text}
              isMine={isMine}
              reactions={reactionsFor("text")}
              onOpenReactions={openReactions}
            />
          ) : null}

          {roomId ? (
            <div className={cn("w-full max-w-[340px]", text ? "mt-1.5" : "")}>
              <RoomPreviewCard
                roomId={roomId}
                isMine={isMine}
                reactions={reactionsFor("room")}
                myReaction={myReaction}
                onReact={(emoji) => {
                  onReact(msg, emoji);
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Recipient: menu on the right of the bubble, panel opens leftward over it. */}
        {!isMine ? menu("end") : null}
      </div>

      {isTimeVisible ? (
        <Timestamp
          time={time}
          isMine={isMine}
          seen={Boolean(msg.seen_at)}
          hasReactions={reactions.length > 0}
        />
      ) : null}
    </div>
  );
}
