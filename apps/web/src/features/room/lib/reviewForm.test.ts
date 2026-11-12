import { describe, expect, it } from "vitest";
import {
  EMPTY_REVIEW,
  MAX_COMMENT_LENGTH,
  RATING_WORDS,
  buildReviewPayload,
  reviewErrors,
} from "./reviewForm";

const valid = { listing_rating: 4, landlord_rating: 5, comment: "" };

describe("reviewErrors", () => {
  it("asks for both ratings on an empty form, and nothing else", () => {
    expect(Object.keys(reviewErrors(EMPTY_REVIEW)).sort()).toEqual([
      "landlord_rating",
      "listing_rating",
    ]);
  });

  it("names the missing rating", () => {
    expect(reviewErrors({ ...valid, listing_rating: 0 })).toEqual({
      listing_rating: "Bạn chọn số sao cho căn phòng nhé.",
    });
    expect(reviewErrors({ ...valid, landlord_rating: 0 })).toEqual({
      landlord_rating: "Bạn chọn số sao cho chủ nhà nhé.",
    });
  });

  it("accepts a form with only the ratings (the comment is optional)", () => {
    expect(reviewErrors(valid)).toEqual({});
  });

  it("accepts a comment at the limit and rejects one character over", () => {
    expect(reviewErrors({ ...valid, comment: "a".repeat(MAX_COMMENT_LENGTH) })).toEqual({});
    expect(reviewErrors({ ...valid, comment: "a".repeat(MAX_COMMENT_LENGTH + 1) })).toEqual({
      comment: `Nhận xét tối đa ${MAX_COMMENT_LENGTH} ký tự.`,
    });
  });
});

describe("buildReviewPayload", () => {
  it("sends both ratings and the trimmed comment", () => {
    expect(buildReviewPayload({ ...valid, comment: "  Phòng sạch  " })).toEqual({
      listing_rating: 4,
      landlord_rating: 5,
      comment: "Phòng sạch",
    });
  });

  it("leaves the comment out when it is blank", () => {
    expect(buildReviewPayload({ ...valid, comment: "   \n " })).toEqual({
      listing_rating: 4,
      landlord_rating: 5,
    });
  });
});

describe("RATING_WORDS", () => {
  it("has one word per star, from worst to best", () => {
    expect(RATING_WORDS).toHaveLength(5);
    expect(RATING_WORDS[0]).toBe("Rất tệ");
    expect(RATING_WORDS[4]).toBe("Tuyệt vời");
  });
});
