import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing, User } from "@/shared/types/api";
import { useRoomActions } from "./useRoomActions";

const mocks = vi.hoisted(() => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  toast: vi.fn(),
  user: { current: null as User | null },
}));
vi.mock("@/features/listings/api/favoritesApi", () => ({
  addFavorite: mocks.addFavorite,
  removeFavorite: mocks.removeFavorite,
}));
vi.mock("@/features/auth/context/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user.current }),
}));
vi.mock("@/shared/ui/toast", () => ({ toast: mocks.toast }));

const STUDENT = { id: 1, role: "student" } as User;
const LANDLORD = { id: 2, role: "landlord" } as User;
const room = (favorited: boolean) => ({ id: 42, is_favorited: favorited }) as Listing;

/** The hook takes the listing state from its parent page, so give it the same shape. */
function mount(initial: Listing | null) {
  return renderHook(() => {
    const [listing, setListing] = useState<Listing | null>(initial);
    return { listing, ...useRoomActions(listing, setListing) };
  });
}

beforeEach(() => {
  mocks.addFavorite.mockReset();
  mocks.removeFavorite.mockReset();
  mocks.toast.mockReset();
  mocks.user.current = STUDENT;
});

describe("useRoomActions: favorites", () => {
  it("reports the saved state of the listing", () => {
    expect(mount(room(true)).result.current.isFavorite).toBe(true);
    expect(mount(room(false)).result.current.isFavorite).toBe(false);
    expect(mount(null).result.current.isFavorite).toBe(false);
  });

  it("saves a room: updates immediately, then confirms", async () => {
    mocks.addFavorite.mockResolvedValue({});
    const { result } = mount(room(false));

    await act(async () => {
      await result.current.toggleFavorite();
    });

    expect(mocks.addFavorite).toHaveBeenCalledWith(42);
    expect(result.current.isFavorite).toBe(true);
    expect(mocks.toast).toHaveBeenCalledWith("Đã lưu phòng.");
  });

  it("un-saves a room", async () => {
    mocks.removeFavorite.mockResolvedValue({});
    const { result } = mount(room(true));

    await act(async () => {
      await result.current.toggleFavorite();
    });

    expect(mocks.removeFavorite).toHaveBeenCalledWith(42);
    expect(result.current.isFavorite).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith("Đã bỏ lưu phòng.");
  });

  it("flips the heart before the request finishes (optimistic)", async () => {
    let finish: () => void = () => undefined;
    mocks.addFavorite.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = mount(room(false));

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.toggleFavorite();
    });
    expect(result.current.isFavorite).toBe(true); // request still in flight

    await act(async () => {
      finish();
      await pending;
    });
    expect(result.current.isFavorite).toBe(true);
  });

  it("rolls back and apologises when saving fails", async () => {
    mocks.addFavorite.mockRejectedValue(new Error("500"));
    const { result } = mount(room(false));

    await act(async () => {
      await result.current.toggleFavorite();
    });

    expect(result.current.isFavorite).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith("Không cập nhật được yêu thích. Bạn thử lại nhé.");
  });

  it("rolls back when un-saving fails", async () => {
    mocks.removeFavorite.mockRejectedValue(new Error("500"));
    const { result } = mount(room(true));

    await act(async () => {
      await result.current.toggleFavorite();
    });

    expect(result.current.isFavorite).toBe(true);
  });

  it.each([
    ["a landlord", LANDLORD],
    ["a signed-out visitor", null],
  ])("does nothing for %s", async (_label, user) => {
    mocks.user.current = user;
    const { result } = mount(room(false));

    await act(async () => {
      await result.current.toggleFavorite();
    });

    expect(mocks.addFavorite).not.toHaveBeenCalled();
    expect(result.current.isFavorite).toBe(false);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("does nothing while the listing has not loaded", async () => {
    const { result } = mount(null);
    await act(async () => {
      await result.current.toggleFavorite();
    });
    expect(mocks.addFavorite).not.toHaveBeenCalled();
  });
});

describe("useRoomActions: copy link", () => {
  function stubClipboard(writeText: () => Promise<void>) {
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  }

  it("copies the page address and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const { result } = mount(room(false));

    act(() => {
      result.current.copyLink();
    });

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith("Đã sao chép liên kết.");
    });
  });

  it("tells the user when the browser refuses", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    const { result } = mount(room(false));

    act(() => {
      result.current.copyLink();
    });

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith("Không sao chép được liên kết.");
    });
  });
});
