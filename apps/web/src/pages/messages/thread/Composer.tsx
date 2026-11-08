import { useRef, type RefObject } from "react";
import { FileText, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/ui/button";
import { QuickReplies } from "@/pages/messages/QuickReplies";
import type { Attachment } from "./useAttachment";

/** Longest message the composer allows. */
export const MESSAGE_MAX = 1000;

function AttachmentChip({ attachment }: { attachment: Attachment }) {
  const { file, remove } = attachment;
  if (!file) return null;
  // The preview is always a blob: object url made by useAttachment; refuse anything else.
  const preview = attachment.preview?.startsWith("blob:") ? attachment.preview : null;
  return (
    <div className="mb-2 max-w-sm flex items-center gap-2 rounded-xl border border-line bg-paper/80 p-2 shadow-xs">
      {preview ? (
        <img
          src={preview}
          alt={file.name}
          className="size-10 rounded-lg object-cover border border-line shrink-0"
        />
      ) : (
        <FileText className="size-5 text-plate shrink-0" />
      )}
      <div className="min-w-0 flex-1 text-xs">
        <p className="truncate font-medium text-ink">{file.name}</p>
        <p className="text-muted text-[11px]">{(file.size / 1024).toFixed(1)} KB</p>
      </div>
      <button
        type="button"
        className="rounded-full p-1 text-xs text-muted hover:text-danger hover:bg-danger-tint transition"
        onClick={remove}
        aria-label="Xóa tệp đính kèm"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export interface ComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  error: string | null | undefined;
  attachment: Attachment;
  textRef: RefObject<HTMLTextAreaElement>;
  /** Suggested first questions (students writing to a landlord who has not replied). */
  showQuickReplies: boolean;
}

/** Auto-growing textarea, attachment picker and send button. */
export function Composer({
  draft,
  onDraftChange,
  onSend,
  sending,
  error,
  attachment,
  textRef,
  showQuickReplies,
}: ComposerProps) {
  const empty = !draft.trim() && !attachment.file;
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0 bg-paper px-3 pb-3 pt-2 sm:px-5">
      {showQuickReplies ? (
        <QuickReplies
          onPick={(text) => {
            onDraftChange(text);
            textRef.current?.focus();
          }}
        />
      ) : null}
      <AttachmentChip attachment={attachment} />

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <input
          key={attachment.inputKey}
          ref={fileInput}
          type="file"
          className="sr-only"
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          onChange={attachment.onPick}
        />
        <button
          type="button"
          aria-label="Đính kèm tệp"
          onClick={() => fileInput.current?.click()}
          className={
            "flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 " +
            "hover:bg-tint hover:text-plate transition-colors focus-visible:outline-none " +
            "focus-visible:ring-2 focus-visible:ring-plate"
          }
        >
          <Paperclip className="size-5" aria-hidden />
        </button>

        <div
          className={
            "relative flex min-h-[46px] max-h-36 flex-1 items-center rounded-2xl border " +
            "border-line-strong bg-card px-3.5 py-1 shadow-card focus-within:border-plate " +
            "focus-within:ring-2 focus-within:ring-plate-tint transition-all"
          }
        >
          <textarea
            ref={textRef}
            value={draft}
            onChange={(e) => {
              onDraftChange(e.target.value.slice(0, MESSAGE_MAX));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            aria-label="Tin nhắn"
            placeholder="Nhập tin nhắn..."
            rows={1}
            className={
              "w-full resize-none bg-transparent py-1.5 text-sm text-ink " +
              "placeholder:text-muted focus:outline-none leading-relaxed"
            }
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={sending}
          disabled={sending || empty}
          className="size-11 shrink-0 rounded-xl p-0 flex items-center justify-center shadow-xs"
          aria-label="Gửi tin nhắn"
        >
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
