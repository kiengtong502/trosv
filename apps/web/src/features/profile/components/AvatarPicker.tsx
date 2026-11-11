import { useState } from "react";
import { Pencil, Shuffle } from "lucide-react";
import { updateProfile } from "@/features/auth/api/authApi";
import { errMessage } from "@/shared/api/axiosClient";
import { Avatar } from "@/shared/ui/avatar";
import { AVATAR_KEYS, AVATAR_NAMES, isAvatarKey, type AvatarKey } from "@/shared/ui/avatar-art";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/toast";
import { cn } from "@/shared/lib/utils";

export interface AvatarPickerProps {
  name: string;
  /** The saved avatar key. */
  avatar: string | undefined;
  /** Called after the server accepted the new avatar. */
  onSaved: () => Promise<unknown>;
}

/** The profile header's avatar; opens a dialog to pick a new one. */
export function AvatarPicker({ name, avatar, onSaved }: AvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<AvatarKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const saved = isAvatarKey(avatar) ? avatar : null;
  const selected = choice ?? saved;

  function onOpenChange(next: boolean): void {
    setOpen(next);
    if (next) {
      setChoice(saved);
      setError("");
    }
  }

  function shuffle(): void {
    const pool = AVATAR_KEYS.filter((k) => k !== selected);
    setChoice(pool[Math.floor(Math.random() * pool.length)] ?? null);
  }

  async function save(): Promise<void> {
    if (!selected) return;
    if (selected === saved) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updateProfile({ avatar: selected });
      await onSaved();
      setOpen(false);
      toast("Đã đổi ảnh đại diện.");
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Đổi ảnh đại diện"
          className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plate focus-visible:ring-offset-2"
        >
          <Avatar name={name} avatar={avatar} size={56} />
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border border-line bg-card text-ink-2 shadow-card transition-transform group-hover:scale-110"
          >
            <Pencil className="size-3" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chọn ảnh đại diện</DialogTitle>
          <DialogDescription>Mọi người sẽ thấy hình này cạnh tên bạn.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-1">
          <Avatar
            name={name}
            avatar={selected}
            size={96}
            className="motion-enter"
            key={selected ?? "none"}
          />
        </div>

        <div role="radiogroup" aria-label="Ảnh đại diện" className="grid grid-cols-4 gap-2">
          {AVATAR_KEYS.map((key) => {
            const on = key === selected;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={AVATAR_NAMES[key]}
                onClick={() => {
                  setChoice(key);
                }}
                className={cn(
                  "motion-press flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors",
                  on ? "border-plate bg-plate-tint" : "border-line bg-card hover:bg-tint",
                )}
              >
                <Avatar name={AVATAR_NAMES[key]} avatar={key} size={52} />
                <span className="text-[11px] font-medium text-ink-2">{AVATAR_NAMES[key]}</span>
              </button>
            );
          })}
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <DialogFooter className="items-center sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={shuffle}>
            <Shuffle className="size-4" aria-hidden />
            Ngẫu nhiên
          </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </DialogClose>
            <Button type="button" variant="primary" loading={busy} onClick={() => void save()}>
              Lưu ảnh
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
