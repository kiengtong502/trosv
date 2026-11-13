import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getConversations } from "@/features/messaging/api/messagingApi";
import { getEcho } from "@/features/messaging/api/echo";
import { CONVERSATION_READ_EVENT } from "@/shared/constants/events";
import { ignoreError } from "@/shared/lib/async";
import type { Conversation } from "@/shared/types/api";

/** Keep both the sidebar and unread badge in sync with server read counts. */
export function useConversations() {
  const { user } = useAuth();
  const userId = user?.id;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId == null) return;
    let active = true;
    let latestRequest = 0;
    const refresh = () => {
      const request = ++latestRequest;
      void getConversations()
        .then((rows) => {
          if (active && request === latestRequest) setConversations(rows);
        })
        .catch(ignoreError("refresh conversations"))
        .finally(() => {
          if (active && request === latestRequest) setLoading(false);
        });
    };

    refresh();
    const channel = getEcho()?.private(`App.Models.User.${userId}`);
    channel?.listen(".message.sent", refresh);
    channel?.listen(".message.deleted", refresh);
    window.addEventListener(CONVERSATION_READ_EVENT, refresh);

    return () => {
      active = false;
      // This user channel is shared by the sidebar and navigation badge.
      channel?.stopListening(".message.sent", refresh);
      channel?.stopListening(".message.deleted", refresh);
      window.removeEventListener(CONVERSATION_READ_EVENT, refresh);
    };
  }, [userId]);

  return { conversations: user ? conversations : [], setConversations, loading };
}
