import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("search pagination", () => {
  it("keeps all five pages reachable on the last page", () => {
    const onPage = vi.fn();
    render(<Pagination page={5} lastPage={5} onPage={onPage} />);
    for (const page of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole("button", { name: `Trang ${page}` })).toBeVisible();
    }
    expect(screen.getByRole("button", { name: "Trang 5" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Trang 1" }));
    expect(onPage).toHaveBeenCalledWith(1);
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Trang cuối" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Trang trước" }));
    expect(onPage).toHaveBeenLastCalledWith(4);
  });

  it("cannot move before page one", () => {
    const onPage = vi.fn();
    render(<Pagination page={1} lastPage={5} onPage={onPage} />);
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Trang đầu" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(onPage).toHaveBeenCalledWith(2);
  });

  it("hides pagination for a single page or empty results", () => {
    const { rerender } = render(<Pagination page={1} lastPage={1} onPage={vi.fn()} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    rerender(<Pagination page={1} lastPage={0} onPage={vi.fn()} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("jumps directly to the first and last page", () => {
    const onPage = vi.fn();
    render(<Pagination page={5} lastPage={10} onPage={onPage} />);
    fireEvent.click(screen.getByRole("button", { name: "Trang đầu" }));
    expect(onPage).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Trang cuối" }));
    expect(onPage).toHaveBeenLastCalledWith(10);
  });
});
