import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Listing, Review } from "@/shared/types/api";
import { RoomReviews } from "./RoomReviews";

const listing = (over: Record<string, unknown> = {}) =>
  ({ id: 12, latitude: 10.8, ...over }) as unknown as Listing;

const review = (over: Record<string, unknown>) =>
  ({ id: 1, rating: 4, ...over }) as unknown as Review;

function renderReviews(l: Listing, reviews: Review[], canWrite = false) {
  return render(
    <MemoryRouter>
      <RoomReviews listing={l} reviews={reviews} canWrite={canWrite} />
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
});
