import { Copy, MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { toast } from "@/shared/ui/toast";
import { cn } from "@/shared/lib/utils";
import { EMOJIS } from "@/features/messaging/components/ReactionBadge";
import type { Message } from "@/shared/types/api";

export interface BubbleMenuProps {
  msg: Message;
  isMine: boolean;
  /** Which side the panel opens towards. */
  align: "start" | "end";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myReaction: string | undefined;
  onReact: (m: Message, emoji: string) => void;
  onUnsend: (m: Message) => void;
  onDeleteSelf: (m: Message) => void;
}

const ITEM =
  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium transition-colors";

function MenuItem({
  tone,
  icon,
  onClick,
  children,
}: {
  tone: "normal" | "danger";
  icon: ReactNode;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        ITEM,
        tone === "danger" ? "text-danger hover:bg-danger-tint" : "text-ink hover:bg-tint",
      )}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

/** The three-dots menu on a bubble: react, copy, unsend (own messages), delete for me. */
export function BubbleMenu({
  msg,
  isMine,
  align,
  open,
  onOpenChange,
  myReaction,
  onReact,
  onUnsend,
  onDeleteSelf,
}: BubbleMenuProps) {
  const close = () => {
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Tùy chọn tin nhắn"
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border border-line",
            "bg-card/95 text-muted shadow-xs transition-all hover:bg-tint hover:text-ink focus-visible:opacity-100",
            open
              ? "opacity-100 bg-tint text-ink border-plate/30 ring-2 ring-plate/20"
              : "opacity-0 group-hover/msg:opacity-100",
          )}
        >
          <MoreVertical className="size-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side="top"
        sideOffset={6}
        collisionPadding={8}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
        className="z-50 w-56 rounded-2xl border border-line bg-card p-2 shadow-pop focus:outline-none"
      >
        <div
          className="flex items-center justify-between gap-0.5 border-b border-line px-1 pb-1.5 pt-0.5 mb-1"
          role="group"
          aria-label="Biểu cảm"
        >
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-base",
                "transition-transform hover:scale-125 hover:bg-tint active:scale-110 focus-visible:outline-none",
                myReaction === e ? "bg-plate/15 ring-2 ring-plate/40" : "",
              )}
              onClick={() => {
                onReact(msg, e);
                close();
              }}
              aria-label={`Biểu cảm ${e}`}
            >
              <span className="leading-none">{e}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          {msg.body ? (
            <MenuItem
              tone="normal"
              icon={<Copy className="size-3.5 text-muted shrink-0" aria-hidden />}
              onClick={() => {
                void navigator.clipboard.writeText(msg.body ?? "");
                toast("Đã sao chép tin nhắn");
                close();
              }}
            >
              Sao chép văn bản
            </MenuItem>
          ) : null}
          {isMine ? (
            <MenuItem
              tone="danger"
              icon={<RotateCcw className="size-3.5 text-danger shrink-0" aria-hidden />}
              onClick={() => {
                onUnsend(msg);
                close();
              }}
            >
              Thu hồi
            </MenuItem>
          ) : null}
          <MenuItem
            tone="normal"
            icon={<Trash2 className="size-3.5 text-muted shrink-0" aria-hidden />}
            onClick={() => {
              onDeleteSelf(msg);
              close();
            }}
          >
            Xóa chỉ ở phía mình
          </MenuItem>
        </div>
      </PopoverContent>
    </Popover>
  );
}
