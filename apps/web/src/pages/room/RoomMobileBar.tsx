import { Button } from "@/ui/button";
import { formatVnd } from "@/lib/format";

/** Sticky price + "message the landlord" bar, phones only. */
export function RoomMobileBar({ price }: { price: number }) {
  return (
    <div
      data-testid="room-mobile-bar"
      className="fixed bottom-14 left-0 right-0 z-20 flex items-center justify-between gap-3 border-t border-line bg-card px-4 py-3 shadow-pop lg:hidden"
    >
      <div>
        <span className="text-xs text-muted">Giá thuê</span>
        <p className="text-xl font-bold tabular-nums text-plate">
          {formatVnd(price)}
          <small className="ml-1 text-xs font-normal text-muted">/th</small>
        </p>
      </div>
      <Button
        variant="primary"
        onClick={() => {
          // The contact card owns the conversation flow; reuse its button.
          document.querySelector<HTMLButtonElement>('[data-testid="contact-card"] button')?.click();
        }}
      >
        Nhắn tin chủ nhà
      </Button>
    </div>
  );
}
