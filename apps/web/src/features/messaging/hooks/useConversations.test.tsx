import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONVERSATION_READ_EVENT } from "@/shared/constants/events";
import type { Conversation } from "@/shared/types/api";
import { useConversations } from "./useConversations";
import { useUnreadCount } from "./useUnreadCount";

const mocks = vi.hoisted(() => ({
  getConversations: vi.fn(),
  listeners: new Map<string, Set<() => void>>(),
}));
vi.mock("@/features/auth/context/AuthContext", () => ({ useAuth: () => ({ user: { id: 1 } }) }));
vi.mock("@/features/messaging/api/messagingApi", () => ({
  getConversations: mocks.getConversations,
}));
vi.mock("@/features/messaging/api/echo", () => ({
  getEcho: () => ({
    private: () => ({
      listen: (name: string, handler: () => void) => {
        const listeners = mocks.listeners.get(name) ?? new Set();
        listeners.add(handler);
        mocks.listeners.set(name, listeners);
      },
      stopListening: (name: string, handler: () => void) => {
        mocks.listeners.get(name)?.delete(handler);
      },
    }),
  }),
}));

const rows = (unread: number) => [{ id: 9, unread_count: unread }] as Conversation[];
const emit = (name: string) =>
  mocks.listeners.get(name)?.forEach((handler) => {
    handler();
  });

beforeEach(() => {
  mocks.listeners.clear();
  mocks.getConversations.mockReset().mockResolvedValue(rows(0));
});

describe("live conversations and unread badges", () => {
  it("refreshes unread counts for incoming messages and clears them after reading", async () => {
    const { result } = renderHook(() => useUnreadCount());
    await waitFor(() => {
      expect(mocks.getConversations).toHaveBeenCalledOnce();
    });

    mocks.getConversations.mockResolvedValue(rows(2));
    act(() => emit(".message.sent"));
    await waitFor(() => {
      expect(result.current).toBe(2);
    });

    mocks.getConversations.mockResolvedValue(rows(0));
    act(() => {
      window.dispatchEvent(new Event(CONVERSATION_READ_EVENT));
    });
    await waitFor(() => {
      expect(result.current).toBe(0);
    });
  });

  it("uses server counts when an already-read message is deleted", async () => {
    mocks.getConversations.mockResolvedValue(rows(3));
    const { result } = renderHook(() => useUnreadCount());
    await waitFor(() => {
      expect(result.current).toBe(3);
    });
    act(() => emit(".message.deleted"));
    await waitFor(() => {
      expect(mocks.getConversations).toHaveBeenCalledTimes(2);
    });
    expect(result.current).toBe(3);
  });

  it("keeps the navigation subscription when the sidebar unmounts", async () => {
    const badge = renderHook(() => useUnreadCount());
    const sidebar = renderHook(() => useConversations());
    await waitFor(() => {
      expect(sidebar.result.current.loading).toBe(false);
    });
    sidebar.unmount();

    mocks.getConversations.mockResolvedValue(rows(1));
    act(() => emit(".message.sent"));
    await waitFor(() => {
      expect(badge.result.current).toBe(1);
    });
    expect(mocks.listeners.get(".message.sent")?.size).toBe(1);
  });

  it("ignores an older unread response that arrives after a read refresh", async () => {
    let finishOldRequest!: (value: Conversation[]) => void;
    mocks.getConversations.mockReturnValueOnce(
      new Promise<Conversation[]>((resolve) => {
        finishOldRequest = resolve;
      }),
    );
    const { result } = renderHook(() => useConversations());
    act(() => {
      window.dispatchEvent(new Event(CONVERSATION_READ_EVENT));
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await act(async () => {
      finishOldRequest(rows(5));
      await Promise.resolve();
    });
    expect(result.current.conversations).toEqual(rows(0));
  });
});
