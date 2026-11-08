import { Button } from "@/ui/button";

/** Sticky "unsaved changes" bar with Reset and Save. */
export function ProfileSaveBar({
  busy,
  dirty,
  onReset,
}: {
  busy: boolean;
  dirty: boolean;
  onReset: () => void;
}) {
  return (
    <div
      data-testid="profile-save-bar"
      className="sticky bottom-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card/95 p-3 shadow-pop backdrop-blur-xs lg:bottom-4"
    >
      <p className="text-sm font-medium text-ink">Có thay đổi chưa lưu</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={busy}>
          Khôi phục
        </Button>
        <Button
          id="profile-submit-btn"
          type="submit"
          variant="primary"
          size="sm"
          loading={busy}
          disabled={!dirty || busy}
        >
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
