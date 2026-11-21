import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Conversation, User } from "@/shared/types/api";
import { useConversations } from "./useConversations";
import { useUnreadCount } from "./useUnreadCount";

const mocks = vi.hoisted(() => ({
  getConversations: vi.fn(),
  handlers: new Map<string, () => void>(),
}));
vi.mock("@/features/messaging/api/messagingApi", () => ({
  getConversations: mocks.getConversations,
}));
const USER = { id: 7, role: "student" } as User;
vi.mock("@/features/auth/context/AuthContext", () => ({ useAuth: () => ({ user: USER }) }));
vi.mock("@/features/messaging/api/echo", () => ({
  getEcho: () => ({
    private: () => ({
      listen: (event: string, cb: () => void) => mocks.handlers.set(event, cb),
      stopListening: vi.fn(),
      subscribed: vi.fn(),
    }),
    leave: vi.fn(),
  }),
}));

const convs = (...counts: number[]) =>
  counts.map((unread_count, id) => ({ id, unread_count }) as unknown as Conversation);

describe("useUnreadCount", () => {
  beforeEach(() => {
    mocks.handlers.clear();
    mocks.getConversations.mockReset();
  });

  it("drops the badge when the user reads a thread (.message.seen)", async () => {
    mocks.getConversations.mockResolvedValueOnce(convs(2, 1));
    const { result } = renderHook(() => useUnreadCount());
    await waitFor(() => {
      expect(result.current).toBe(3);
    });

    mocks.getConversations.mockResolvedValueOnce(convs(0, 1));
    act(() => mocks.handlers.get(".message.seen")?.());
    await waitFor(() => {
      expect(result.current).toBe(1);
    });
  });

  it("re-reads the server count on new and deleted messages", async () => {
    mocks.getConversations.mockResolvedValue(convs(0));
    renderHook(() => useUnreadCount());
    await waitFor(() => {
      expect(mocks.getConversations).toHaveBeenCalledTimes(1);
    });

    act(() => mocks.handlers.get(".message.sent")?.());
    act(() => mocks.handlers.get(".message.deleted")?.());
    await waitFor(() => {
      expect(mocks.getConversations).toHaveBeenCalledTimes(3);
    });
  });
});

describe("shared conversation list", () => {
  beforeEach(() => {
    mocks.handlers.clear();
    mocks.getConversations.mockReset();
  });

  it("serves the badge and the sidebar from one request per event", async () => {
    mocks.getConversations.mockResolvedValue(convs(2));
    const { result } = renderHook(() => ({
      unread: useUnreadCount(),
      list: useConversations().conversations,
    }));
    await waitFor(() => {
      expect(result.current.unread).toBe(2);
    });
    expect(result.current.list).toHaveLength(1);
    expect(mocks.getConversations).toHaveBeenCalledTimes(1);

    act(() => mocks.handlers.get(".message.sent")?.());
    await waitFor(() => {
      expect(mocks.getConversations).toHaveBeenCalledTimes(2);
    });
  });
});
