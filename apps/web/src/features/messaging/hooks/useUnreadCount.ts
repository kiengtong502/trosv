import { useConversations } from "@/features/messaging/hooks/useConversations";

export function useUnreadCount(): number {
  const { conversations } = useConversations();
  return conversations.reduce((sum, conversation) => sum + (conversation.unread_count ?? 0), 0);
}
