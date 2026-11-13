import { beforeEach, expect, it, vi } from "vitest";
import { CONVERSATION_READ_EVENT } from "@/shared/constants/events";
import { markRead } from "./messagingApi";

const post = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api/axiosClient", () => ({ default: { post } }));
beforeEach(() => {
  post.mockReset();
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
