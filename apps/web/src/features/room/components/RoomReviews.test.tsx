import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Listing, Review } from "@/shared/types/api";
import { RoomReviews } from "./RoomReviews";

const listing = (over: Record<string, unknown> = {}) =>
  ({ id: 12, latitude: 10.8, ...over }) as unknown as Listing;

const review = (over: Record<string, unknown>) =>
  ({ id: 1, rating: 4, ...over }) as unknown as Review;

function renderReviews(l: Listing, reviews: Review[], canWrite = false, isStudent = false) {
  return render(
    <MemoryRouter>
      <RoomReviews listing={l} reviews={reviews} canWrite={canWrite} isStudent={isStudent} />
    </MemoryRouter>,
  );
}

describe("RoomReviews", () => {
  it("invites the first review when there are none", () => {
    renderReviews(listing(), []);
    expect(screen.getByText(/Chưa có đánh giá nào cho phòng này/)).toBeInTheDocument();
  });

  it("lists each review with its author and comment", () => {
    renderReviews(listing(), [
      review({ id: 1, student: { name: "An" }, comment: "Phòng sạch" }),
      review({ id: 2, user_name: "Bình", comment: "Chủ nhà thân thiện" }),
      review({ id: 3, comment: undefined }),
    ]);

    expect(screen.getByText("An")).toBeInTheDocument();
    expect(screen.getByText("Phòng sạch")).toBeInTheDocument();
    expect(screen.getByText("Bình")).toBeInTheDocument(); // falls back to user_name
    expect(screen.getByText("Sinh viên")).toBeInTheDocument(); // then to a generic label
    expect(screen.queryByText(/Chưa có đánh giá nào/)).not.toBeInTheDocument();
  });

  it("shows rating bars only when the room has averages", () => {
    const { unmount } = renderReviews(listing(), []);
    expect(screen.queryByText("Chủ nhà")).not.toBeInTheDocument();
    unmount();

    renderReviews(listing({ ratings: { listing_avg: 4.5, landlord_avg: null, area_avg: 3 } }), []);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("3.0")).toBeInTheDocument();
    expect(screen.getByText("–")).toBeInTheDocument(); // landlord has no rating yet
  });

  it("offers 'write a review' only to people who may write one", () => {
    const { unmount } = renderReviews(listing(), [], false);
    expect(screen.queryByRole("link", { name: "Viết đánh giá" })).not.toBeInTheDocument();
    unmount();

    renderReviews(listing(), [], true);
    expect(screen.getByRole("link", { name: "Viết đánh giá" })).toBeInTheDocument();
  });

  it("the 'write a review' link points at this room, not at a route pattern", () => {
    renderReviews(listing({ id: 12 }), [], true);
    const href = screen.getByRole("link", { name: "Viết đánh giá" }).getAttribute("href");
    expect(href).toBe("/rooms/12?review=1");
    expect(href).not.toContain(":id");
  });

  describe("why a student cannot review", () => {
    it("tells a student who has not messaged the landlord to do that first", () => {
      renderReviews(listing({ my_conversation_id: null }), [], false, true);
      expect(
        screen.getByText("Nhắn tin cho chủ nhà để có thể đánh giá phòng này."),
      ).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Viết đánh giá" })).not.toBeInTheDocument();
    });

    it("tells a student who already has a conversation but no button that they have reviewed", () => {
      renderReviews(listing({ my_conversation_id: 5 }), [], false, true);
      expect(screen.getByText("Bạn đã đánh giá phòng này.")).toBeInTheDocument();
    });

    it("says nothing to a student who can write a review (they have the button)", () => {
      renderReviews(listing({ my_conversation_id: 5 }), [], true, true);
      expect(screen.queryByText(/Nhắn tin cho chủ nhà để có thể đánh giá/)).not.toBeInTheDocument();
      expect(screen.queryByText("Bạn đã đánh giá phòng này.")).not.toBeInTheDocument();
    });

    it("says nothing to visitors and landlords", () => {
      renderReviews(listing({ my_conversation_id: null }), [], false, false);
      expect(screen.queryByText(/Nhắn tin cho chủ nhà để có thể đánh giá/)).not.toBeInTheDocument();
    });
  });
});
