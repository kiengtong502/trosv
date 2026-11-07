const REPLIES = [
  "Phòng còn trống không ạ?",
  "Em xem phòng được lúc nào ạ?",
  "Giá có thương lượng được không ạ?",
] as const;

/*
  Suggested first questions for a student, shown until the landlord replies.
  One line that scrolls sideways (swipe on a phone, no wrapping); a fade at the
  edges hints that more chips are off-screen. Tapping a chip only fills the
  message box, it never sends.
*/
export function QuickReplies({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div
      data-testid="quick-replies"
      className="mb-2.5 flex snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain px-3 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0,#000_12px,#000_calc(100%-28px),transparent_100%)] [mask-image:linear-gradient(90deg,transparent_0,#000_12px,#000_calc(100%-28px),transparent_100%)] -mx-3 sm:-mx-5 sm:px-5"
    >
      {REPLIES.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => { onPick(text); }}
          className="min-h-10 flex-none snap-start whitespace-nowrap rounded-full border border-line-strong bg-card px-3.5 text-[13px] font-medium text-ink transition-colors hover:border-plate hover:bg-plate-tint hover:text-plate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
