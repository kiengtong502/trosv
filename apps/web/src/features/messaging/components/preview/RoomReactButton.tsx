import { SmilePlus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { EMOJIS } from "@/features/messaging/components/ReactionBadge";

const stop = (e: { preventDefault: () => void; stopPropagation: () => void }) => {
  // The button sits inside the card's link: reacting must not navigate.
  e.preventDefault();
  e.stopPropagation();
};

/** Small smiley on the card that opens the emoji picker. */
export function RoomReactButton({
  open,
  onOpenChange,
  isMine,
  myReaction,
  onReact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMine: boolean;
  myReaction: string | null | undefined;
  onReact: (emoji: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Thả cảm xúc phòng này"
            onClick={(e) => {
              stop(e);
              onOpenChange(!open);
            }}
            className={cn(
              "flex size-6 items-center justify-center rounded-full border border-line",
              "bg-card/95 text-muted transition-all hover:bg-tint hover:text-plate hover:scale-110",
              "focus-visible:outline-none",
              myReaction
                ? "text-plate border-plate/30 bg-tint/80 ring-1 ring-plate/20"
                : "opacity-80 sm:opacity-0 group-hover/card:opacity-100",
            )}
          >
            {myReaction ? (
              <span className="text-xs leading-none">{myReaction}</span>
            ) : (
              <SmilePlus className="size-3.5" aria-hidden />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={isMine ? "end" : "start"}
          side="bottom"
          sideOffset={6}
          collisionPadding={8}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
          className="z-50 w-auto rounded-2xl border border-line bg-card p-1.5 shadow-pop focus:outline-none"
          onClick={stop}
        >
          <div className="flex items-center gap-1" role="group" aria-label="Biểu cảm">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-base",
                  "transition-transform hover:scale-125 hover:bg-tint",
                  "active:scale-110 focus-visible:outline-none",
                  myReaction === e ? "bg-plate/15 ring-2 ring-plate/40" : "",
                )}
                onClick={(ev) => {
                  stop(ev);
                  onReact(e);
                  onOpenChange(false);
                }}
                aria-label={`Biểu cảm ${e}`}
              >
                <span className="leading-none">{e}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
