import { beforeEach, expect, it, vi } from "vitest";
import { CONVERSATION_READ_EVENT } from "@/shared/constants/events";
import { getMessages, markRead } from "./messagingApi";

const post = vi.hoisted(() => vi.fn());
const get = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api/axiosClient", () => ({ default: { post, get } }));
beforeEach(() => {
  post.mockReset();
  get.mockReset();
});

const page = (start: number, count: number) => ({
  data: { data: Array.from({ length: count }, (_, index) => ({ id: start + index })) },
});

it("loads message 501 using the last HTTP page ID", async () => {
  get.mockResolvedValueOnce(page(1, 500)).mockResolvedValueOnce(page(501, 1));
  const messages = await getMessages(9);
  expect(messages).toHaveLength(501);
  expect(messages.at(-1)?.id).toBe(501);
  expect(get).toHaveBeenNthCalledWith(2, "/conversations/9/messages", {
    params: { after_id: 500 },
  });
});

it("continues multiple full pages and stops on an empty page", async () => {
  get
    .mockResolvedValueOnce(page(101, 500))
    .mockResolvedValueOnce(page(601, 500))
    .mockResolvedValueOnce(page(1101, 0));
  const messages = await getMessages(9, 100);
  expect(messages).toHaveLength(1000);
  expect(get).toHaveBeenNthCalledWith(1, "/conversations/9/messages", {
    params: { after_id: 100 },
  });
  expect(get).toHaveBeenNthCalledWith(3, "/conversations/9/messages", {
    params: { after_id: 1100 },
  });
});

it("rejects an incomplete history when a later page fails", async () => {
  get.mockResolvedValueOnce(page(1, 500)).mockRejectedValueOnce(new Error("offline"));
  await expect(getMessages(9)).rejects.toThrow("offline");
});

it("does not loop forever if the server repeats a full page", async () => {
  get.mockResolvedValue(page(1, 500));
  await expect(getMessages(9)).rejects.toThrow("Không thể tải tiếp tin nhắn.");
  expect(get).toHaveBeenCalledTimes(2);
});

it("announces a read only after the server accepts it", async () => {
  let finish!: (response: unknown) => void;
  post.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const onRead = vi.fn();
  window.addEventListener(CONVERSATION_READ_EVENT, onRead);
  try {
    const pending = markRead(9);
    expect(onRead).not.toHaveBeenCalled();
    finish({ data: null });
    await pending;
    expect(onRead).toHaveBeenCalledOnce();
    const event = onRead.mock.calls[0]?.[0] as CustomEvent<{ conversationId: number }>;
    expect(event.detail.conversationId).toBe(9);
  } finally {
    window.removeEventListener(CONVERSATION_READ_EVENT, onRead);
  }
});

it("keeps the unread badge when marking read fails", async () => {
  post.mockRejectedValue(new Error("offline"));
  const onRead = vi.fn();
  window.addEventListener(CONVERSATION_READ_EVENT, onRead);
  try {
    await expect(markRead(9)).rejects.toThrow("offline");
    expect(onRead).not.toHaveBeenCalled();
  } finally {
    window.removeEventListener(CONVERSATION_READ_EVENT, onRead);
  }
});
