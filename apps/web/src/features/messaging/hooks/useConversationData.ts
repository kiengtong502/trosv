import { useCallback, useEffect, useRef, useState } from "react";
import { getConversations, getMessages, markRead } from "@/features/messaging/api/messagingApi";
import type { Conversation, Message } from "@/shared/types/api";
import { ignoreError } from "@/shared/lib/async";
import { mergeMessages } from "@/features/messaging/lib/mergeMessages";

/**
 * Conversation header + message list for the /messages/:id thread.
 * Owns: header fetch, initial message load (with last-id tracking for
 * the realtime layer), markRead on open, and per-conversation reset.
 * Realtime updates arrive through useConversationRealtime, which shares
 * setMessages/lastIdRef with this hook via the returned refs/state.
 */
export function useConversationData(id: string | number): {
  conversation: Conversation | null;
  convLoaded: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loaded: boolean;
  lastIdRef: { current: number };
  syncMessages: () => void;
} {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [convLoaded, setConvLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const lastIdRef = useRef(0);
  const syncRef = useRef<() => void>(() => undefined);
  const syncMessages = useCallback(() => {
    syncRef.current();
  }, []);

  // Per-conversation state reset during render (React's recommended
  // "adjust state when props change" idiom) instead of setState inside
  // an effect - the fresh id renders with a clean slate immediately.
  const [prevId, setPrevId] = useState<string | number>(id);
  if (prevId !== id) {
    setPrevId(id);
    setConversation(null);
    setConvLoaded(false);
    setMessages([]);
    setLoaded(false);
  }

  // Load conversation header (other user, listing).
  useEffect(() => {
    let active = true;
    getConversations()
      .then((list) => {
        if (active) setConversation(list.find((c) => String(c.id) === String(id)) || null);
      })
      .catch(ignoreError("load conversation header"))
      .finally(() => {
        if (active) setConvLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Only HTTP-confirmed IDs advance the cursor; a newer realtime ID may have gaps.
  useEffect(() => {
    let active = true;
    let cursor = 0;
    let pending = false;
    let queued = false;
    lastIdRef.current = 0;
    function sync(): void {
      if (pending) {
        queued = true;
        return;
      }
      pending = true;
      queued = false;
      getMessages(id, cursor || null)
        .then((rows) => {
          if (!active) return;
          cursor = rows.at(-1)?.id ?? cursor;
          lastIdRef.current = Math.max(lastIdRef.current, cursor);
          setMessages((current) => mergeMessages(current, rows));
          if (!queued) markRead(id).catch(ignoreError("mark read after sync"));
        })
        .catch(ignoreError("load messages"))
        .finally(() => {
          pending = false;
          if (!active) return;
          if (queued) sync();
          else setLoaded(true);
        });
    }
    syncRef.current = sync;
    sync();
    return () => {
      active = false;
      syncRef.current = () => undefined;
    };
  }, [id]);

  return {
    conversation,
    convLoaded,
    messages,
    setMessages,
    loaded,
    lastIdRef,
    syncMessages,
  };
}
