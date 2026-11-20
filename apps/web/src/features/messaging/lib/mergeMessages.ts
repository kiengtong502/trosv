import type { Message } from "@/shared/types/api";

/** Keep live changes when an older HTTP snapshot arrives, and sort late deliveries. */
export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map(incoming.map((message) => [message.id, message]));
  for (const message of current) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}
