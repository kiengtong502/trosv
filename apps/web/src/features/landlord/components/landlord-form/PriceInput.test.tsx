import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { PriceInput } from "./PriceInput";

it("uses native number controls with a 100,000 VND step", () => {
  render(<PriceInput value={2500000} onChange={vi.fn()} />);
  const input = screen.getByRole<HTMLInputElement>("spinbutton");
  expect(input).toHaveAttribute("step", "100000");
  input.stepUp();
  expect(input.value).toBe("2600000");
  input.stepDown();
  expect(input.value).toBe("2500000");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("passes manually entered prices to the form", () => {
  const onChange = vi.fn();
  render(<PriceInput value={2500000} onChange={onChange} />);
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3000000" } });
  expect(onChange).toHaveBeenCalledWith("3000000");
});
