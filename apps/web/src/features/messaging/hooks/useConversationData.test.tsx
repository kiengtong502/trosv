import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Message, User } from "@/shared/types/api";
import { useConversationData } from "./useConversationData";
import { useConversationRealtime } from "./useConversationRealtime";

/*
  Fake server: each GET snapshots the "database" when it is called, and the
  answer is held until the test releases it (network latency). That is what
  makes the two races below reproducible.
*/
const mocks = vi.hoisted(() => ({
  db: [] as number[],
  handlers: new Map<string, (e: unknown) => void>(),
  onSubscribed: null as null | (() => void),
  held: [] as (() => void)[],
}));
vi.mock("@/features/messaging/api/messagingApi", () => ({
  getConversations: () => Promise.resolve([]),
  getMessages: (_id: unknown, afterId: number | null) => {
    const snapshot = mocks.db.filter((id) => id > (afterId ?? 0));
    return new Promise((resolve) => {
      mocks.held.push(() => {
        resolve(snapshot.map(message));
      });
    });
  },
  markRead: () => Promise.resolve(),
}));
const USER = { id: 7, role: "student" } as User;
vi.mock("@/features/auth/context/AuthContext", () => ({ useAuth: () => ({ user: USER }) }));
vi.mock("@/features/messaging/api/echo", () => ({
  getEcho: () => ({
    private: () => ({
      listen: (event: string, cb: (e: unknown) => void) => mocks.handlers.set(event, cb),
      listenForWhisper: vi.fn(),
      subscribed: (cb: () => void) => {
        mocks.onSubscribed = cb;
      },
    }),
    leave: vi.fn(),
  }),
}));

function message(id: number): Message {
  return { id, sender_id: 9, body: `m${id}`, created_at: "2026-11-21T00:00:00Z" } as Message;
}

function releaseAll(): void {
  act(() => {
    while (mocks.held.length) mocks.held.shift()?.();
  });
}

function mountThread() {
  return renderHook(() => {
    const data = useConversationData(1);
    useConversationRealtime(1, data);
    return data;
  });
}

const ids = (messages: Message[]) => messages.map((m) => m.id);

describe("thread sync races", () => {
  beforeEach(() => {
    mocks.db = [1, 2];
    mocks.handlers.clear();
    mocks.held.length = 0;
    mocks.onSubscribed = null;
  });

  it("keeps a message that arrives over WebSocket before the first load returns", async () => {
    const { result } = mountThread();
    await waitFor(() => {
      expect(mocks.held).toHaveLength(1); // the first GET saw [1, 2]
    });

    mocks.db.push(3);
    act(() => mocks.handlers.get(".message.sent")?.({ message: message(3) }));

    await waitFor(() => {
      releaseAll();
      expect(ids(result.current.messages)).toEqual([1, 2, 3]);
    });
  });

  it("catches up a message sent before the channel subscription finished", async () => {
    const { result } = mountThread();
    await waitFor(() => {
      expect(mocks.held).toHaveLength(1);
    });
    mocks.db.push(3); // sent in the gap: no WebSocket event will ever come for it
    releaseAll();
    await waitFor(() => {
      expect(ids(result.current.messages)).toEqual([1, 2]);
    });

    act(() => mocks.onSubscribed?.());

    await waitFor(() => {
      releaseAll();
      expect(ids(result.current.messages)).toEqual([1, 2, 3]);
    });
  });
});
