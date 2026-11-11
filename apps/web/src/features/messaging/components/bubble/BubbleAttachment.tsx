import { useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ReactionBadge } from "@/features/messaging/components/ReactionBadge";

export interface BubbleAttachmentProps {
  url: string;
  name: string | null | undefined;
  isImage: boolean;
  isMine: boolean;
  /** Reactions to hang on this attachment (empty when another element carries them). */
  reactions: string[];
  onOpenReactions: () => void;
}

/** An image (or a file chip when it is not an image or fails to load). */
export function BubbleAttachment({
  url,
  name,
  isImage,
  isMine,
  reactions,
  onOpenReactions,
}: BubbleAttachmentProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasBadge = reactions.length > 0;

  return (
    <div className={cn("relative max-w-full", hasBadge ? "mb-2.5" : "")}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={
          "mb-1 block overflow-hidden rounded-xl border border-line bg-card " +
          "shadow-xs transition hover:opacity-90 max-w-full"
        }
      >
        {isImage && !imgFailed ? (
          <img
            src={url}
            alt={name ?? "Ảnh đính kèm"}
            className="max-h-64 w-auto max-w-full rounded-xl object-contain block bg-sunken"
            loading="lazy"
            onError={() => {
              setImgFailed(true);
            }}
          />
        ) : (
          <span className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink hover:underline">
            <FileText className="size-4 text-plate flex-none" />
            <span className="max-w-[200px] truncate">{name ?? "Tài liệu đính kèm"}</span>
          </span>
        )}
      </a>
      {hasBadge ? (
        <ReactionBadge reactions={reactions} isMine={isMine} onClick={onOpenReactions} />
      ) : null}
    </div>
  );
}
