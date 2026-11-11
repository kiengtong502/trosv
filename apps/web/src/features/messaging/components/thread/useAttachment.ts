import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { toast } from "@/shared/ui/toast";

/** Largest file the composer accepts. */
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

/** The file chosen in the composer, with an object-url preview for images. */
export function useAttachment() {
  // Bumped to remount the <input type=file>, which is how a file input is cleared.
  const [inputKey, setInputKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Revoke the object url when it is replaced or the composer goes away.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function remove(): void {
    setPreview(null);
    setFile(null);
    setInputKey((n) => n + 1);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>): void {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.size > ATTACHMENT_MAX_BYTES) {
      toast("Tệp đính kèm tối đa 5 MB.");
      e.target.value = "";
      return;
    }
    setFile(picked);
    setPreview(picked.type.startsWith("image/") ? URL.createObjectURL(picked) : null);
  }

  return { inputKey, file, preview, remove, onPick };
}

export type Attachment = ReturnType<typeof useAttachment>;
