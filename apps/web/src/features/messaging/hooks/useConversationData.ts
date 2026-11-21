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
 * setMessages/syncMessages with this hook.
 */
export function useConversationData(id: string | number): {
  conversation: Conversation | null;
  convLoaded: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loaded: boolean;
  syncMessages: (refresh?: boolean) => void;
} {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [convLoaded, setConvLoaded] = useState(false);
  const [messages, setMessageRows] = useState<Message[]>([]);
  const messageVersion = useRef(0);
  const setMessages = useCallback<React.Dispatch<React.SetStateAction<Message[]>>>((update) => {
    messageVersion.current += 1;
    setMessageRows(update);
  }, []);
  const [loaded, setLoaded] = useState(false);
  const syncRef = useRef<(refresh?: boolean) => void>(() => undefined);
  const syncMessages = useCallback((refresh = false) => {
    syncRef.current(refresh);
  }, []);

  // Per-conversation state reset during render (React's recommended
  // "adjust state when props change" idiom) instead of setState inside
  // an effect - the fresh id renders with a clean slate immediately.
  const [prevId, setPrevId] = useState<string | number>(id);
  if (prevId !== id) {
    setPrevId(id);
    setConversation(null);
    setConvLoaded(false);
    setMessageRows([]);
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
    let refreshQueued = false;
    function sync(refresh = false): void {
      refreshQueued ||= refresh;
      if (pending) {
        queued = true;
        return;
      }
      pending = true;
      queued = false;
      const replace = refreshQueued;
      refreshQueued = false;
      const version = messageVersion.current;
      getMessages(id, replace ? null : cursor || null)
        .then((rows) => {
          if (!active) return;
          // A live action after this request started makes its snapshot stale.
          if (version !== messageVersion.current) {
            queued = true;
            refreshQueued = true;
            return;
          }
          cursor = rows.at(-1)?.id ?? cursor;
          setMessageRows((current) => (replace ? rows : mergeMessages(current, rows)));
          if (!queued) markRead(id).catch(ignoreError("mark read after sync"));
        })
        .catch((error: unknown) => {
          refreshQueued ||= replace;
          ignoreError("load messages")(error);
        })
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
    syncMessages,
  };
}
