import { useState } from "react";
import type { FormEvent } from "react";
import { createReview } from "@/features/listings/api/listingApi";
import { errFieldErrors, errMessage } from "@/shared/api/axiosClient";
import { cn } from "@/shared/lib/utils";
import type { Listing } from "@/shared/types/api";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/input";
import { toast } from "@/shared/ui/toast";
import {
  EMPTY_REVIEW,
  MAX_COMMENT_LENGTH,
  buildReviewPayload,
  reviewErrors,
} from "../lib/reviewForm";
import type { ReviewFormState } from "../lib/reviewForm";
import { StarRatingInput } from "./StarRatingInput";

export interface ReviewDialogProps {
  listing: Listing;
  open: boolean;
  onClose: () => void;
  /** Called after the review was stored, so the page can reload the list and averages. */
  onSubmitted: () => void;
}

export function ReviewDialog({ listing, open, onClose, onSubmitted }: ReviewDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        {/* Mounted only while open, so every opening starts with an empty form. */}
        <ReviewForm listing={listing} onClose={onClose} onSubmitted={onSubmitted} />
      </DialogContent>
    </Dialog>
  );
}

function ReviewForm({ listing, onClose, onSubmitted }: Omit<ReviewDialogProps, "open">) {
  const [form, setForm] = useState<ReviewFormState>({ ...EMPTY_REVIEW });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ReviewFormState>(key: K, value: ReviewFormState[K]): void => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBanner("");
    const problems = reviewErrors(form);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setBusy(true);
    try {
      await createReview(listing.id, buildReviewPayload(form));
      toast("Cảm ơn bạn đã đánh giá!");
      onSubmitted();
    } catch (err: unknown) {
      const fromServer: Record<string, string> = {};
      for (const [field, messages] of Object.entries(errFieldErrors(err))) {
        if (messages[0]) fromServer[field] = messages[0];
      }
      setErrors(fromServer);
      setBanner(errMessage(err, "Không gửi được đánh giá. Bạn thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  const remaining = MAX_COMMENT_LENGTH - form.comment.length;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        void submit(e);
      }}
    >
      <DialogHeader>
        <DialogTitle>Viết đánh giá</DialogTitle>
        <DialogDescription>
          Chia sẻ trải nghiệm của bạn về "{listing.title}" để các bạn sinh viên khác chọn phòng dễ
          hơn.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        {banner ? (
          <p role="alert" className="rounded-xl bg-plate-tint p-3 text-sm text-ink">
            {banner}
          </p>
        ) : null}

        <StarRatingInput
          name="review-listing"
          label="Căn phòng"
          value={form.listing_rating}
          onChange={(v) => {
            set("listing_rating", v);
          }}
          error={errors["listing_rating"]}
        />
        <StarRatingInput
          name="review-landlord"
          label="Chủ nhà"
          value={form.landlord_rating}
          onChange={(v) => {
            set("landlord_rating", v);
          }}
          error={errors["landlord_rating"]}
        />

        <div className="flex flex-col gap-1.5">
          <Field
            id="review-comment"
            label="Nhận xét"
            hint="Không bắt buộc"
            error={errors["comment"]}
          >
            <Textarea
              id="review-comment"
              value={form.comment}
              onChange={(e) => {
                set("comment", e.target.value);
              }}
              invalid={!!errors["comment"]}
              placeholder="Phòng có sạch sẽ không? Chủ nhà trao đổi có dễ không? Khu vực có an toàn không?"
            />
          </Field>
          <p
            className={cn(
              "text-right text-xs tabular-nums",
              remaining < 0 ? "text-danger" : "text-muted",
            )}
            aria-live="polite"
          >
            {form.comment.length}/{MAX_COMMENT_LENGTH}
          </p>
        </div>
      </div>

      <p id="review-submit-note" className="mt-5 rounded-lg bg-tint p-3 text-sm text-ink-2">
        Mỗi phòng chỉ được đánh giá một lần. Bạn không thể chỉnh sửa sau khi gửi. Vui lòng kiểm tra
        số sao và nội dung trước khi gửi.
      </p>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Hủy
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={busy}
          aria-describedby="review-submit-note"
        >
          Gửi đánh giá
        </Button>
      </DialogFooter>
    </form>
  );
}
