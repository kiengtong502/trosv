import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { StarRatingInput } from "./StarRatingInput";

function Harness({ initial = 0, error }: { initial?: number; error?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <StarRatingInput name="r" label="Căn phòng" value={value} onChange={setValue} error={error} />
  );
}

const star = (n: number) => screen.getByRole("radio", { name: new RegExp(`^${n} sao`) });

describe("StarRatingInput", () => {
  it("is a labelled group of five radios, none chosen at first", () => {
    render(<Harness />);
    expect(screen.getByRole("group", { name: /Căn phòng/ })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    screen.getAllByRole("radio").forEach((r) => {
      expect(r).not.toBeChecked();
    });
  });

  it("gives every star a spoken name with its meaning", () => {
    render(<Harness />);
    expect(screen.getByRole("radio", { name: "1 sao - Rất tệ" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "5 sao - Tuyệt vời" })).toBeInTheDocument();
  });

  it("choosing a star checks it and writes the rating in words", () => {
    render(<Harness />);
    fireEvent.click(star(4));
    expect(star(4)).toBeChecked();
    expect(screen.getByText("Tốt")).toBeInTheDocument();
  });

  it("changing the choice moves the check", () => {
    render(<Harness initial={2} />);
    expect(star(2)).toBeChecked();
    fireEvent.click(star(5));
    expect(star(5)).toBeChecked();
    expect(star(2)).not.toBeChecked();
  });

  it("reports the chosen number to the parent", () => {
    const onChange = vi.fn();
    render(<StarRatingInput name="r" label="Chủ nhà" value={0} onChange={onChange} />);
    fireEvent.click(star(3));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("hovering previews a rating in words without choosing it", () => {
    render(<Harness initial={2} />);
    const label = star(5).closest("label") as HTMLElement;
    fireEvent.mouseEnter(label);
    expect(screen.getByText("Tuyệt vời")).toBeInTheDocument();
    expect(star(2)).toBeChecked(); // still the real choice

    fireEvent.mouseLeave(label.parentElement as HTMLElement);
    expect(screen.queryByText("Tuyệt vời")).not.toBeInTheDocument();
    expect(screen.getByText("Tệ")).toBeInTheDocument(); // back to the real choice (2)
  });

  it("marks the field as required without making it part of the spoken label", () => {
    render(<Harness />);
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows an error as an alert tied to the group", () => {
    render(<Harness error="Bạn chọn số sao cho căn phòng nhé." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Bạn chọn số sao cho căn phòng nhé.");
    expect(screen.getByRole("group")).toHaveAttribute("aria-describedby", "r-error");
  });

  it("shows no alert when there is no error", () => {
    render(<Harness />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
