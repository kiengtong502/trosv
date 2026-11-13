import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { Dispatch, SetStateAction } from "react";
import type { Message } from "@/shared/types/api";
import { useConversationRealtime } from "./useConversationRealtime";

const mocks = vi.hoisted(() => ({
  handlers: new Map<string, (payload: unknown) => void>(),
  subscribe: vi.fn(),
  leave: vi.fn(),
  markRead: vi.fn(),
}));
vi.mock("@/features/auth/context/AuthContext", () => ({ useAuth: () => ({ user: { id: 1 } }) }));
vi.mock("@/features/messaging/api/messagingApi", () => ({ markRead: mocks.markRead }));
vi.mock("@/features/messaging/api/echo", () => ({
  getEcho: () => ({ private: mocks.subscribe, leave: mocks.leave }),
}));

beforeEach(() => {
  mocks.handlers.clear();
  mocks.leave.mockReset();
  mocks.markRead.mockReset().mockResolvedValue(undefined);
  mocks.subscribe.mockReset().mockReturnValue({
    listen: (name: string, handler: (payload: unknown) => void) => {
      mocks.handlers.set(name, handler);
    },
    listenForWhisper: vi.fn(),
  });
});

it("keeps the thread subscribed across renders and uses the latest preview callback", () => {
  const setMessages = vi.fn<Dispatch<SetStateAction<Message[]>>>();
  const lastId = { current: 0 };
  const originalPreview = vi.fn();
  const latestPreview = vi.fn();
  const { rerender } = renderHook(
    ({ preview }) => useConversationRealtime(9, setMessages, lastId, preview),
    { initialProps: { preview: originalPreview } },
  );
  rerender({ preview: latestPreview });
  expect(mocks.subscribe).toHaveBeenCalledOnce();
  expect(mocks.leave).not.toHaveBeenCalled();

  const message = { id: 12, sender_id: 2, body: "New message" };
  act(() => {
    mocks.handlers.get(".message.sent")?.({ message });
  });
  expect(setMessages).toHaveBeenCalledOnce();
  expect(lastId.current).toBe(12);
  expect(latestPreview).toHaveBeenCalledWith(message);
  expect(originalPreview).not.toHaveBeenCalled();
  expect(mocks.markRead).toHaveBeenCalledWith(9);
});
