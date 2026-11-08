import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { Trash2 } from "lucide-react";
import { Tag } from "@/ui/badge";
import { cn } from "@/lib/utils";
import { SECTION } from "./styles";
import type { ListingFormApi } from "./types";

/** Edit mode: the photos already on the listing, with delete; the first is the cover. */
export function ExistingPhotos({ form: f }: { form: ListingFormApi }) {
  if (!f.isEdit) return null;
  return (
    <section className={SECTION}>
      <h2 className="text-xl font-semibold">Ảnh tin đăng</h2>
      {f.images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {f.images.map((img, i) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl bg-sunken">
              <img
                src={img.url}
                alt=""
                width={200}
                height={133}
                className="aspect-3/2 w-full object-cover"
              />
              {i === 0 ? (
                <span className="absolute left-1 top-1">
                  <Tag>Ảnh bìa</Tag>
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void f.handleDeleteImage(img.id)}
                aria-label={`Xóa ảnh ${i + 1}`}
                className={
                  "absolute right-1 top-1 flex size-7 items-center justify-center " +
                  "rounded-full bg-card/90 text-ink opacity-0 transition-opacity " +
                  "group-hover:opacity-100 focus-visible:opacity-100"
                }
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Drag and drop (or click) to choose new photos: up to 5, the first is the cover. */
export function PhotoDropzone({ form: f }: { form: ListingFormApi }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    f.pickFiles(Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/")));
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-card p-6">
      <h2 className="text-xl font-semibold">Ảnh</h2>
      <div
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => {
          setDragOver(false);
        }}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl",
          "border-2 border-dashed p-8 text-center transition-colors",
          dragOver ? "border-plate bg-plate-tint/50" : "border-line-strong bg-tint",
        )}
        onClick={() => fileInput.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInput.current?.click();
        }}
        aria-label="Chọn hoặc kéo thả ảnh"
      >
        <p className="text-sm font-medium text-ink">Kéo thả ảnh vào đây, hoặc bấm để chọn</p>
        <p className="text-xs text-muted">JPG, PNG hoặc WebP · tối đa 5 ảnh · mỗi ảnh 2 MB</p>
        {f.newFiles.length > 0 ? (
          <p className="text-xs text-ink-2 tabular-nums">
            Đã chọn {f.newFiles.length} ảnh (ảnh đầu tiên là ảnh bìa)
          </p>
        ) : null}
      </div>
      <input
        ref={fileInput}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={f.handleFilePick}
      />
    </section>
  );
}
