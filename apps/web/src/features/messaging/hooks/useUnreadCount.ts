import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getConversations } from "@/features/messaging/api/messagingApi";
import { getEcho } from "@/features/messaging/api/echo";
import type { EchoReactive } from "@/features/messaging/api/echo";
import { ignoreError } from "@/shared/lib/async";

/**
 * Total unread count for the messages rail badge. The server's per-
 * conversation unread_count is the only source of truth: every event on
 * the private user channel (sent / deleted / seen) re-reads it, so reading
 * a thread or an unsend can never leave a stale or drifting badge.
 */
export function useUnreadCount(): number {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const refresh = () => {
      getConversations()
        .then((convs) => {
          if (cancelled) return;
          setUnread(convs.reduce((sum, c) => sum + (c.unread_count ?? 0), 0));
        })
        .catch(ignoreError("unread count refresh"));
    };
    refresh();

    /* getEcho() returns null while logged out. */
    const e = getEcho();
    if (e) {
      const userChan: EchoReactive = e.private(`App.Models.User.${user.id}`);
      userChan.listen(".message.sent", refresh);
      userChan.listen(".message.deleted", refresh);
      userChan.listen(".message.seen", refresh);
    }

    return () => {
      cancelled = true;
      /* Leave ONLY the user channel: conversation channels are owned by
         the thread hooks (see useConversationRealtime cleanup note). */
      if (e) e.leave(`App.Models.User.${user.id}`);
    };
  }, [user]);

  return unread;
}
