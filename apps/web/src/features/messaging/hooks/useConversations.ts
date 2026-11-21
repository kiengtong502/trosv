import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getConversations } from "@/features/messaging/api/messagingApi";
import { getEcho } from "@/features/messaging/api/echo";
import { ignoreError } from "@/shared/lib/async";
import type { Conversation } from "@/shared/types/api";

/*
  ONE shared copy of GET /conversations for the sidebar and the unread badge.
  A single set of listeners on the private user channel re-reads it from the
  server (sent / deleted / seen - markRead broadcasts .message.seen to the
  reader) and after every (re)subscribe, so nothing missed while offline stays
  stale. Attached while at least one component uses it.
*/

interface ConversationsState {
  conversations: Conversation[];
  loading: boolean;
}

const EMPTY: ConversationsState = { conversations: [], loading: true };
const USER_EVENTS = [".message.sent", ".message.deleted", ".message.seen"];

let state = EMPTY;
const listeners = new Set<() => void>();
let users = 0;
let latestRequest = 0;
let detach: (() => void) | null = null;

function emit(next: ConversationsState): void {
  state = next;
  listeners.forEach((listener) => {
    listener();
  });
}

function refresh(): void {
  const request = ++latestRequest;
  getConversations()
    .then((rows) => {
      if (request === latestRequest) emit({ conversations: rows, loading: false });
    })
    .catch((error: unknown) => {
      if (request === latestRequest) emit({ ...state, loading: false });
      ignoreError("refresh conversations")(error);
    });
}

function attach(userId: number): () => void {
  refresh();
  const channel = getEcho()?.private(`App.Models.User.${userId}`);
  let active = true;
  USER_EVENTS.forEach((event) => channel?.listen(event, refresh));
  channel?.subscribed(() => {
    if (active) refresh();
  });
  return () => {
    active = false;
    latestRequest += 1; // drop answers still in flight
    // Stop only our handlers: the channel object is shared, leave() would break others.
    USER_EVENTS.forEach((event) => channel?.stopListening(event, refresh));
    state = EMPTY;
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Local optimistic edit (e.g. the open thread's preview line); the next server read wins. */
export function setConversations(update: (rows: Conversation[]) => Conversation[]): void {
  emit({ ...state, conversations: update(state.conversations) });
}

export function useConversations(): { conversations: Conversation[]; loading: boolean } {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (userId == null) return undefined;
    users += 1;
    if (users === 1) detach = attach(userId);
    return () => {
      users -= 1;
      if (users === 0) {
        detach?.();
        detach = null;
      }
    };
  }, [userId]);

  const snapshot = useSyncExternalStore(subscribe, () => state);
  return { conversations: user ? snapshot.conversations : [], loading: snapshot.loading };
}
