import { List as ListIcon, Map as MapIcon } from "lucide-react";

export type MobileTab = "list" | "map";

/** Floating "show map / show list" button, phones only. */
export function MobileViewToggle({ tab, onToggle }: { tab: MobileTab; onToggle: () => void }) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 lg:hidden">
      <button
        type="button"
        onClick={onToggle}
        className={
          "flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold " +
          "text-white shadow-pop transition hover:scale-105 active:scale-95"
        }
      >
        {tab === "list" ? (
          <>
            <MapIcon className="size-4 text-flyer" />
            <span>Xem bản đồ</span>
          </>
        ) : (
          <>
            <ListIcon className="size-4 text-flyer" />
            <span>Xem danh sách</span>
          </>
        )}
      </button>
    </div>
  );
}
