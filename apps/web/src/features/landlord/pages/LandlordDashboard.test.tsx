import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/shared/constants/routes";
import type { Listing, Paged } from "@/shared/types/api";
import LandlordDashboard from "./LandlordDashboard";

const mocks = vi.hoisted(() => ({
  getMyListings: vi.fn(),
  deleteListing: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/features/landlord/api/landlordApi", () => ({
  getMyListings: mocks.getMyListings,
  deleteListing: mocks.deleteListing,
}));
vi.mock("@/shared/ui/toast", () => ({ toast: mocks.toast }));

const listing = (id: number, over: Record<string, unknown> = {}) =>
  ({
    id,
    title: `Phòng ${id}`,
    price: 2500000,
    area_m2: 20,
    address: `${id} Võ Văn Ngân`,
    status: "available",
    cover_image: null,
    avg_rating: null,
    reviews_count: 0,
    ...over,
  }) as unknown as Listing;

const page = (rows: Listing[]): Paged<Listing> => ({
  data: rows,
  meta: { current_page: 1, last_page: 1, per_page: 10, total: rows.length },
});

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.LANDLORD]}>
      <Routes>
        <Route path={ROUTES.LANDLORD} element={<LandlordDashboard />} />
        <Route path={ROUTES.LANDLORD_EDIT} element={<p>trang sửa tin</p>} />
        <Route path={ROUTES.LANDLORD_NEW} element={<p>trang đăng tin</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const rows = () => screen.queryAllByTestId("listing-row");

beforeEach(() => {
  mocks.getMyListings.mockReset();
  mocks.deleteListing.mockReset();
  mocks.toast.mockReset();
});

describe("LandlordDashboard: listing", () => {
  it("shows each listing with its price, size, address and status", async () => {
    mocks.getMyListings.mockResolvedValue(
      page([listing(1), listing(2, { status: "rented", area_m2: null })]),
    );
    renderDashboard();

    await waitFor(() => {
      expect(rows()).toHaveLength(2);
    });
    expect(document.title).toBe("Quản lý tin đăng · TROSV");
    expect(screen.getByText("2 tin")).toBeInTheDocument();
    expect(within(rows()[0] as HTMLElement).getByText("Phòng 1")).toBeInTheDocument();
    expect(within(rows()[0] as HTMLElement).getByText(/· 20 m²/)).toBeInTheDocument();
    expect(within(rows()[0] as HTMLElement).getByText("1 Võ Văn Ngân")).toBeInTheDocument();
    expect(within(rows()[0] as HTMLElement).getByText("Còn trống")).toBeInTheDocument();
    expect(within(rows()[1] as HTMLElement).getByText("Đã thuê")).toBeInTheDocument();
    expect(within(rows()[1] as HTMLElement).queryByText(/m²/)).not.toBeInTheDocument();
  });

  it("asks for the first page of all listings", async () => {
    mocks.getMyListings.mockResolvedValue(page([]));
    renderDashboard();
    await waitFor(() => {
      expect(mocks.getMyListings).toHaveBeenCalledWith(1, "");
    });
  });

  it("invites the landlord to post their first listing", async () => {
    mocks.getMyListings.mockResolvedValue(page([]));
    renderDashboard();

    expect(await screen.findByText("Chưa có tin đăng nào")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Đăng tin" }));
    expect(await screen.findByText("trang đăng tin")).toBeInTheDocument();
  });

  it("labels a listing without a status 'Mới'", async () => {
    mocks.getMyListings.mockResolvedValue(page([listing(1, { status: undefined })]));
    renderDashboard();
    expect(await screen.findByText("Mới")).toBeInTheDocument();
  });

  it("links to the public page and to the editor", async () => {
    mocks.getMyListings.mockResolvedValue(page([listing(7)]));
    renderDashboard();
    await screen.findByText("Phòng 7");

    expect(screen.getByRole("link", { name: /Xem tin/ })).toHaveAttribute("href", "/rooms/7");
    fireEvent.click(screen.getByRole("button", { name: /Sửa/ }));
    expect(await screen.findByText("trang sửa tin")).toBeInTheDocument();
  });
});

describe("LandlordDashboard: filtering", () => {
  it("reloads with the chosen status", async () => {
    mocks.getMyListings.mockResolvedValue(page([listing(1)]));
    renderDashboard();
    await screen.findByText("Phòng 1");

    mocks.getMyListings.mockResolvedValue(page([listing(2, { status: "rented" })]));
    fireEvent.click(screen.getByRole("button", { name: "Đã thuê" }));

    expect(await screen.findByText("Phòng 2")).toBeInTheDocument();
    expect(screen.queryByText("Phòng 1")).not.toBeInTheDocument();
    expect(mocks.getMyListings).toHaveBeenLastCalledWith(1, "rented");
  });

  it("ignores a slow answer for a filter the user has already left", async () => {
    let answerSlow: (p: Paged<Listing>) => void = () => undefined;
    mocks.getMyListings
      .mockResolvedValueOnce(page([]))
      .mockReturnValueOnce(
        new Promise<Paged<Listing>>((resolve) => {
          answerSlow = resolve;
        }),
      )
      .mockResolvedValueOnce(page([listing(3, { status: "hidden" })]));
    renderDashboard();
    await screen.findByText("Chưa có tin đăng nào");

    fireEvent.click(screen.getByRole("button", { name: "Đã thuê" })); // slow, never answered yet
    fireEvent.click(screen.getByRole("button", { name: "Ẩn" })); // fast
    expect(await screen.findByText("Phòng 3")).toBeInTheDocument();

    await act(async () => {
      answerSlow(page([listing(99)])); // the old "rented" answer finally arrives
      await Promise.resolve();
    });
    expect(screen.queryByText("Phòng 99")).not.toBeInTheDocument();
    expect(screen.getByText("Phòng 3")).toBeInTheDocument();
  });

  it("shows an error when loading fails", async () => {
    mocks.getMyListings.mockRejectedValue(new Error("offline"));
    renderDashboard();
    expect(await screen.findByText("Không tải được tin đăng.")).toBeInTheDocument();
  });

  it("recovers from a failed load when the next load succeeds", async () => {
    mocks.getMyListings.mockRejectedValueOnce(new Error("offline"));
    renderDashboard();
    await screen.findByText("Không tải được tin đăng.");

    mocks.getMyListings.mockResolvedValue(page([listing(5)]));
    fireEvent.click(screen.getByRole("button", { name: "Còn trống" }));

    expect(await screen.findByText("Phòng 5")).toBeInTheDocument();
    expect(screen.queryByText("Không tải được tin đăng.")).not.toBeInTheDocument();
  });
});

describe("LandlordDashboard: deleting", () => {
  async function openDeleteDialog() {
    mocks.getMyListings.mockResolvedValue(page([listing(1), listing(2)]));
    renderDashboard();
    await screen.findByText("Phòng 1");
    fireEvent.click(screen.getAllByTestId("delete-listing")[0] as HTMLElement);
    return screen.findByRole("dialog");
  }

  it("asks before deleting and names the listing", async () => {
    const dialog = await openDeleteDialog();
    expect(within(dialog).getByText("Xóa tin đăng?")).toBeInTheDocument();
    expect(within(dialog).getByText(/Tin "Phòng 1"/)).toBeInTheDocument();
    expect(mocks.deleteListing).not.toHaveBeenCalled();
  });

  it("'Giữ lại' closes the dialog and deletes nothing", async () => {
    const dialog = await openDeleteDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Giữ lại" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mocks.deleteListing).not.toHaveBeenCalled();
    expect(rows()).toHaveLength(2);
  });

  it("deletes the confirmed listing and removes only that row", async () => {
    mocks.deleteListing.mockResolvedValue({});
    const dialog = await openDeleteDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Xóa tin" }));

    await waitFor(() => {
      expect(rows()).toHaveLength(1);
    });
    expect(mocks.deleteListing).toHaveBeenCalledWith(1);
    expect(screen.queryByText("Phòng 1")).not.toBeInTheDocument();
    expect(screen.getByText("Phòng 2")).toBeInTheDocument();
    expect(mocks.toast).toHaveBeenCalledWith("Đã xóa tin đăng.");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("keeps the listing and says so when the delete fails", async () => {
    mocks.deleteListing.mockRejectedValue(new Error("500"));
    const dialog = await openDeleteDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Xóa tin" }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith("Không xóa được tin. Bạn thử lại nhé.");
    });
    expect(rows()).toHaveLength(2);
  });
});
