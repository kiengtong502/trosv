import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing } from "@/shared/types/api";
import { ReviewDialog } from "./ReviewDialog";

const mocks = vi.hoisted(() => ({ createReview: vi.fn(), toast: vi.fn() }));
vi.mock("@/features/listings/api/listingApi", () => ({ createReview: mocks.createReview }));
vi.mock("@/shared/ui/toast", () => ({ toast: mocks.toast }));

const LISTING = { id: 12, title: "Phòng gần ĐHQG" } as Listing;
const onClose = vi.fn();
const onSubmitted = vi.fn();

function renderDialog(open = true) {
  return render(
    <ReviewDialog listing={LISTING} open={open} onClose={onClose} onSubmitted={onSubmitted} />,
  );
}

const group = (name: RegExp) => screen.getByRole("group", { name });
const pick = (g: RegExp, stars: number) => {
  fireEvent.click(within(group(g)).getByRole("radio", { name: new RegExp(`^${stars} sao`) }));
};
const send = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Gửi đánh giá" }));
  await Promise.resolve();
};
const banner = () =>
  screen.queryAllByRole("alert").find((el) => !el.id.endsWith("-error") && el.tagName === "P");
const apiError = (status: number, data: unknown) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);

beforeEach(() => {
  mocks.createReview.mockReset();
  mocks.toast.mockReset();
  onClose.mockReset();
  onSubmitted.mockReset();
});

describe("ReviewDialog: what is shown", () => {
  it("renders nothing while closed", () => {
    renderDialog(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("names the room and offers two ratings and an optional comment", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Viết đánh giá" });
    expect(dialog).toHaveTextContent("Phòng gần ĐHQG");
    expect(group(/Căn phòng/)).toBeInTheDocument();
    expect(group(/Chủ nhà/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nhận xét/)).toBeInTheDocument();
    expect(screen.getByText("Không bắt buộc")).toBeInTheDocument();
    expect(screen.getByText("0/1000")).toBeInTheDocument();
  });

  it("counts the characters of the comment", () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(/Nhận xét/), { target: { value: "Rất tốt" } });
    expect(screen.getByText("7/1000")).toBeInTheDocument();
  });

  it("'Hủy' asks the page to close the dialog", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("starts empty every time it is opened", () => {
    const { rerender } = renderDialog();
    pick(/Căn phòng/, 5);
    fireEvent.change(screen.getByLabelText(/Nhận xét/), { target: { value: "nháp" } });

    rerender(
      <ReviewDialog listing={LISTING} open={false} onClose={onClose} onSubmitted={onSubmitted} />,
    );
    rerender(<ReviewDialog listing={LISTING} open onClose={onClose} onSubmitted={onSubmitted} />);

    expect(
      within(group(/Căn phòng/))
        .getAllByRole("radio")
        .every((r) => !(r as HTMLInputElement).checked),
    ).toBe(true);
    expect(screen.getByLabelText(/Nhận xét/)).toHaveValue("");
  });
});

describe("ReviewDialog: validation", () => {
  it("does not send until both ratings are chosen, and says which one is missing", async () => {
    renderDialog();
    pick(/Căn phòng/, 4);
    await send();

    expect(screen.getByText("Bạn chọn số sao cho chủ nhà nhé.")).toBeInTheDocument();
    expect(screen.queryByText("Bạn chọn số sao cho căn phòng nhé.")).not.toBeInTheDocument();
    expect(mocks.createReview).not.toHaveBeenCalled();
  });

  it("asks for both ratings on an empty form", async () => {
    renderDialog();
    await send();
    expect(screen.getByText("Bạn chọn số sao cho căn phòng nhé.")).toBeInTheDocument();
    expect(screen.getByText("Bạn chọn số sao cho chủ nhà nhé.")).toBeInTheDocument();
  });

  it("clears a rating's error as soon as it is chosen", async () => {
    renderDialog();
    await send();
    pick(/Căn phòng/, 3);
    expect(screen.queryByText("Bạn chọn số sao cho căn phòng nhé.")).not.toBeInTheDocument();
    expect(screen.getByText("Bạn chọn số sao cho chủ nhà nhé.")).toBeInTheDocument();
  });

  it("refuses a comment over the limit", async () => {
    renderDialog();
    pick(/Căn phòng/, 4);
    pick(/Chủ nhà/, 4);
    fireEvent.change(screen.getByLabelText(/Nhận xét/), { target: { value: "a".repeat(1001) } });
    await send();

    expect(screen.getByText("Nhận xét tối đa 1000 ký tự.")).toBeInTheDocument();
    expect(mocks.createReview).not.toHaveBeenCalled();
  });
});

describe("ReviewDialog: sending", () => {
  async function fillAndSend(comment = "") {
    pick(/Căn phòng/, 4);
    pick(/Chủ nhà/, 5);
    if (comment)
      fireEvent.change(screen.getByLabelText(/Nhận xét/), { target: { value: comment } });
    await send();
  }

  it("sends the ratings and the trimmed comment, then thanks the user and tells the page", async () => {
    mocks.createReview.mockResolvedValue({ id: 1 });
    renderDialog();
    await fillAndSend("  Chủ nhà thân thiện  ");

    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalledOnce();
    });
    expect(mocks.createReview).toHaveBeenCalledWith(12, {
      listing_rating: 4,
      landlord_rating: 5,
      comment: "Chủ nhà thân thiện",
    });
    expect(mocks.toast).toHaveBeenCalledWith("Cảm ơn bạn đã đánh giá!");
  });

  it("sends no comment key when the comment is blank", async () => {
    mocks.createReview.mockResolvedValue({ id: 1 });
    renderDialog();
    await fillAndSend();
    await waitFor(() => {
      expect(mocks.createReview).toHaveBeenCalledWith(12, {
        listing_rating: 4,
        landlord_rating: 5,
      });
    });
  });

  it("disables the button while the request is in flight", async () => {
    let finish: (v: unknown) => void = () => undefined;
    mocks.createReview.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderDialog();
    await fillAndSend();

    expect(screen.getByRole("button", { name: /Gửi đánh giá/ })).toBeDisabled();
    finish({ id: 1 });
    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalled();
    });
  });

  it("shows the server's reason when the student has not messaged the landlord yet", async () => {
    mocks.createReview.mockRejectedValue(
      apiError(403, { message: "Bạn cần nhắn tin với chủ nhà trước khi đánh giá." }),
    );
    renderDialog();
    await fillAndSend();

    await waitFor(() => {
      expect(banner()).toHaveTextContent("Bạn cần nhắn tin với chủ nhà trước khi đánh giá.");
    });
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument(); // stays open, nothing is lost
  });

  it("explains a duplicate review", async () => {
    mocks.createReview.mockRejectedValue(
      apiError(422, {
        message: "Bạn đã đánh giá tin này rồi.",
        errors: { listing_id: ["Bạn đã đánh giá tin này rồi."] },
      }),
    );
    renderDialog();
    await fillAndSend();
    await waitFor(() => {
      expect(banner()).toHaveTextContent("Bạn đã đánh giá tin này rồi.");
    });
  });

  it("puts server validation messages next to their fields", async () => {
    mocks.createReview.mockRejectedValue(
      apiError(422, {
        message: "Dữ liệu không hợp lệ.",
        errors: { comment: ["Bình luận không được vượt quá 1000 ký tự."] },
      }),
    );
    renderDialog();
    await fillAndSend("x");
    expect(
      await screen.findByText("Bình luận không được vượt quá 1000 ký tự."),
    ).toBeInTheDocument();
  });

  it("keeps what the user typed after a failure so they can retry", async () => {
    mocks.createReview.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ id: 1 });
    renderDialog();
    await fillAndSend("Nhận xét của tôi");
    await waitFor(() => {
      expect(banner()).toBeDefined();
    });

    expect(screen.getByLabelText(/Nhận xét/)).toHaveValue("Nhận xét của tôi");
    expect(within(group(/Căn phòng/)).getByRole("radio", { name: /^4 sao/ })).toBeChecked();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Gửi đánh giá" })).toBeEnabled();
    });
    await send();
    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalledOnce();
    });
  });

  it("falls back to a friendly message for an unknown failure", async () => {
    mocks.createReview.mockRejectedValue("boom");
    renderDialog();
    await fillAndSend();
    await waitFor(() => {
      expect(banner()).toHaveTextContent("Không gửi được đánh giá. Bạn thử lại nhé.");
    });
  });
});
