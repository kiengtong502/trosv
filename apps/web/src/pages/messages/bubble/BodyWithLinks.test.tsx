import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BodyWithLinks } from "./BodyWithLinks";

describe("BodyWithLinks", () => {
  it("renders plain text without anchors", () => {
    render(<BodyWithLinks text="Chào bạn" />);
    expect(screen.getByText("Chào bạn")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("opens external links in a new tab, safely", () => {
    render(<BodyWithLinks text="xem https://example.com/a nhé" />);
    const link = screen.getByRole("link", { name: "https://example.com/a" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("keeps room links in the same tab", () => {
    render(<BodyWithLinks text="phòng /rooms/42" />);
    const link = screen.getByRole("link", { name: "/rooms/42" });
    expect(link).toHaveAttribute("href", "/rooms/42");
    expect(link).not.toHaveAttribute("target");
  });

  it("links every url in a message, not just the first", () => {
    render(<BodyWithLinks text="https://a.test và https://b.test và /rooms/1" />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});
