/*
  Pure model of the "write a review" form: its state, the checks done before sending, and the
  request body. No React. The server enforces the same limits (ReviewStoreRequest).
*/

import type { ReviewPayload } from "@/shared/types/api";

export const MAX_COMMENT_LENGTH = 1000;

/** What each star count means, shown next to the stars (index = rating - 1). */
export const RATING_WORDS = ["Rất tệ", "Tệ", "Tạm ổn", "Tốt", "Tuyệt vời"] as const;

export interface ReviewFormState {
  /** 0 = not chosen yet. */
  listing_rating: number;
  landlord_rating: number;
  comment: string;
}

export const EMPTY_REVIEW: ReviewFormState = { listing_rating: 0, landlord_rating: 0, comment: "" };

/** Field -> message, for the fields that are not valid. Empty object = ready to send. */
export function reviewErrors(form: ReviewFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.listing_rating < 1) errors["listing_rating"] = "Bạn chọn số sao cho căn phòng nhé.";
  if (form.landlord_rating < 1) errors["landlord_rating"] = "Bạn chọn số sao cho chủ nhà nhé.";
  if (form.comment.length > MAX_COMMENT_LENGTH) {
    errors["comment"] = `Nhận xét tối đa ${MAX_COMMENT_LENGTH} ký tự.`;
  }
  return errors;
}

/** Body of the request: trimmed comment, omitted when blank. */
export function buildReviewPayload(form: ReviewFormState): ReviewPayload {
  const comment = form.comment.trim();
  return {
    listing_rating: form.listing_rating,
    landlord_rating: form.landlord_rating,
    ...(comment ? { comment } : {}),
  };
}
