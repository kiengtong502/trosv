import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PRICE_STEP, PriceRange } from "./price-range";

function setup(min = "", max = "") {
  const onChange = vi.fn<(min: string, max: string) => void>();
  render(<PriceRange id="pr" min={min} max={max} onChange={onChange} />);
  return {
    onChange,
    minDot: screen.getByRole("slider", { name: "Giá tối thiểu" }),
    maxDot: screen.getByRole("slider", { name: "Giá tối đa" }),
    readout: screen.getByTestId("pr-readout"),
  };
}

const move = (dot: HTMLElement, value: number) => {
  fireEvent.change(dot, { target: { value: String(value) } });
};

describe("PriceRange", () => {
  it("is one bar with two dots, no number boxes", () => {
    setup();
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(document.querySelector('input[type="number"]')).toBeNull();
  });

  it("moves in 100.000đ steps", () => {
    const { minDot, maxDot } = setup();
    expect(minDot).toHaveAttribute("step", String(PRICE_STEP));
    expect(maxDot).toHaveAttribute("step", "100000");
  });

  it("says 'no limit' when nothing is set", () => {
    expect(setup().readout).toHaveTextContent("Không giới hạn");
  });

  it("shows exact prices, never rounded", () => {
    expect(setup("1250000", "3700000").readout).toHaveTextContent("1.250.000đ – 3.700.000đ");
  });

  it.each([
    ["1500000", "", "Từ 1.500.000đ"],
    ["", "2500000", "Đến 2.500.000đ"],
  ])("describes a one-sided range (%j, %j)", (min, max, text) => {
    expect(setup(min, max).readout).toHaveTextContent(text);
  });

  it("puts the dots on their saved values", () => {
    const { minDot, maxDot } = setup("2000000", "5000000");
    expect(minDot).toHaveValue("2000000");
    expect(maxDot).toHaveValue("5000000");
  });

  it("rests at the ends when unset", () => {
    const { minDot, maxDot } = setup();
    expect(minDot).toHaveValue("0");
    expect(maxDot).toHaveValue("10000000");
  });

  it("reports the new range when the lower dot moves", () => {
    const { minDot, onChange } = setup("", "3000000");
    move(minDot, 1_500_000);
    expect(onChange).toHaveBeenCalledWith("1500000", "3000000");
  });

  it("reports the new range when the upper dot moves", () => {
    const { maxDot, onChange } = setup("1000000", "");
    move(maxDot, 4_000_000);
    expect(onChange).toHaveBeenCalledWith("1000000", "4000000");
  });

  it("clears a side (empty string) when its dot returns to the end", () => {
    const { minDot, maxDot, onChange } = setup("1000000", "3000000");
    move(minDot, 0);
    expect(onChange).toHaveBeenLastCalledWith("", "3000000");
    move(maxDot, 10_000_000);
    expect(onChange).toHaveBeenLastCalledWith("1000000", "");
  });

  it("never lets the dots touch: the lower stays one step under the upper", () => {
    const { minDot, onChange } = setup("2000000", "2500000");
    move(minDot, 2_500_000);
    expect(onChange).toHaveBeenCalledWith("2400000", "2500000");
  });

  it("never lets the upper dot cross the lower", () => {
    const { maxDot, onChange } = setup("2000000", "2500000");
    move(maxDot, 1_000_000);
    expect(onChange).toHaveBeenCalledWith("2000000", "2100000");
  });

  it("exposes readable values to screen readers", () => {
    const { maxDot, minDot } = setup("1000000", "");
    expect(minDot).toHaveAttribute("aria-valuetext", "1.000.000đ");
    expect(maxDot).toHaveAttribute("aria-valuetext", "10.000.000đ trở lên");
  });

  it("clamps saved values outside the bar", () => {
    const { minDot, maxDot } = setup("-5", "99999999");
    expect(minDot).toHaveValue("0");
    expect(maxDot).toHaveValue("10000000");
  });
});
