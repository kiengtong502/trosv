import type { Conversation } from "@/types/api";

export interface ConversationRowView {
  /** Name of the other person. */
  name: string;
  unread: number;
  /** Last message text, prefixed "Bạn: " when you sent it. */
  preview: string;
  lastAt: string | null;
}

/** What one row of the conversation list shows, derived from the conversation. */
export function describeConversation(
  c: Conversation,
  viewerId: number | undefined,
): ConversationRowView {
  const mine = viewerId != null && c.last_message?.sender_id === viewerId;
  return {
    name: c.other_user?.name ?? "Người dùng",
    unread: c.unread_count ?? 0,
    preview: `${mine ? "Bạn: " : ""}${c.last_message?.body ?? ""}`,
    lastAt: c.last_message?.created_at ?? null,
  };
}
