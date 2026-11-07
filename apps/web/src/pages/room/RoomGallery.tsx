import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { HousePlaceholder } from "@/ui/icons";
import { cn } from "@/lib/utils";
import type { ListingImage } from "@/types/api";

export interface RoomGalleryProps {
  images: ListingImage[];
  /** Opens the lightbox at the photo being shown. */
  onOpen: (index: number) => void;
}

/** Big photo with arrows + a thumbnail strip; the bento hero's left tile. */
export function RoomGallery({ images, onOpen }: RoomGalleryProps) {
  const [at, setAt] = useState(0);
  const count = images.length;
  const current = images[at];

  function go(step: number): void {
    setAt((i) => (i + step + count) % count);
  }

  return (
    <div data-testid="room-gallery" className="flex min-w-0 flex-col gap-2">
      <div className="group relative aspect-3/2 overflow-hidden rounded-xl bg-sunken lg:aspect-auto lg:min-h-[420px] lg:flex-1">
        {current?.url ? (
          <img
            data-testid="gallery-main"
            src={current.url}
            alt=""
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <HousePlaceholder />
        )}
        <button
          type="button"
          onClick={() => {
            onOpen(at);
          }}
          aria-label="Xem ảnh lớn"
          className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate"
        />
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => {
                go(-1);
              }}
              aria-label="Ảnh trước"
              className="motion-press absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-ink shadow-card"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                go(1);
              }}
              aria-label="Ảnh sau"
              className="motion-press absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-ink shadow-card"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        ) : null}
        {count > 0 ? (
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-paper">
            <Maximize2 className="size-3" aria-hidden />
            {at + 1} / {count}
          </span>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              data-testid="gallery-thumb"
              onClick={() => {
                setAt(i);
              }}
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === at}
              className={cn(
                "aspect-3/2 overflow-hidden rounded-lg bg-sunken transition-[box-shadow,opacity] duration-150",
                i === at ? "ring-2 ring-plate" : "opacity-80 hover:opacity-100",
              )}
            >
              <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
