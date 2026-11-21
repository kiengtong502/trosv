import { useConversations } from "@/features/messaging/hooks/useConversations";

/**
 * Total unread count for the messages rail badge, summed from the shared
 * conversation list (server unread_count is the only source of truth).
 */
export function useUnreadCount(): number {
  const { conversations } = useConversations();
  return conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);
}
