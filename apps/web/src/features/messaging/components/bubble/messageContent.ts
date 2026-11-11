/*
  Pure helpers for a chat message: attachment urls, link/room extraction and
  timestamps. No React, so they are unit-tested directly.
*/

const ROOM_LINK = /(?:https?:\/\/[^\s]+)?\/rooms\/(\d+)/;
const ROOM_LINK_ALL = /(?:https?:\/\/[^\s]+)?\/rooms\/\d+/g;
const IMAGE_FILE = /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)($|\?)/i;
const ROOM_INTRO = /^Chào bạn,\s*mình quan tâm đến phòng trọ:/i;

/**
 * Chuẩn hóa attachment_url sang đường dẫn tương đối (/attachments/...)
 * để browser gọi đúng port của ứng dụng (5174 hoặc 5173).
 */
export function resolveAttachmentUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    return url;
  }
}

export function isImageAttachment(
  name?: string | null,
  url?: string | null,
  type?: string | null,
): boolean {
  if (type?.startsWith("image/")) return true;
  return IMAGE_FILE.test(name ?? "") || IMAGE_FILE.test(url ?? "");
}

export interface ParsedBody {
  /** Id of a shared room (`/rooms/42`), shown as a preview card. */
  roomId: number | null;
  /** The text without the room link, trimmed. */
  text: string;
}

/** Splits a message body into its shared room (if any) and the remaining text. */
export function parseMessageBody(body: string | null | undefined): ParsedBody {
  const raw = body ?? "";
  const roomId = Number(ROOM_LINK.exec(raw)?.[1]);
  // No link, or /rooms/0 (not a real room): leave the text exactly as written.
  if (!roomId) return { roomId: null, text: raw };

  let text = raw.replace(ROOM_LINK_ALL, "").trim();
  if (ROOM_INTRO.test(text)) text = "Chào bạn, mình quan tâm đến phòng trọ này:";
  return { roomId, text };
}

/** Which element carries the reactions badge: the bottom-most one present. */
export type BadgeTarget = "room" | "text" | "attachment" | null;

export function pickBadgeTarget(has: {
  roomPreview: boolean;
  text: boolean;
  attachment: boolean;
}): BadgeTarget {
  if (has.roomPreview) return "room";
  if (has.text) return "text";
  if (has.attachment) return "attachment";
  return null;
}

const TIME = { hour: "2-digit", minute: "2-digit" } as const;
const DATE = { day: "2-digit", month: "2-digit", year: "numeric" } as const;

/** "08:09" for the label under a bubble and "08:09, 05/03/2026" for its tooltip. */
export function formatMessageTimes(iso: string | null | undefined): { time: string; full: string } {
  if (!iso) return { time: "", full: "" };
  const date = new Date(iso);
  const time = date.toLocaleTimeString("vi-VN", TIME);
  return { time, full: `${time}, ${date.toLocaleDateString("vi-VN", DATE)}` };
}

/** Splits text on http(s) links and /rooms/ links; odd entries are the links. */
export function splitLinks(text: string): string[] {
  return text.split(/(https?:\/\/[^\s]+|\/rooms\/\d+)/);
}

export interface MessageView {
  /** Emoji of every reaction, in order. */
  reactions: string[];
  /** The viewer's own reaction, if any. */
  myReaction: string | undefined;
  attachmentUrl: string | null;
  /** Shared room card, or null. */
  roomId: number | null;
  /** Text shown in the bubble (room link removed). */
  text: string;
  time: string;
  /** Time and date for the tooltip. */
  fullTime: string;
  badgeTarget: BadgeTarget;
}

/** Everything the bubble needs to render, derived once from the raw message. */
export function describeMessage(
  msg: {
    body?: string | null | undefined;
    attachment_url?: string | null | undefined;
    reactions?: Record<string, string> | null | undefined;
    created_at?: string | null | undefined;
  },
  currentUserId: number | undefined,
): MessageView {
  const reactionsMap = msg.reactions ?? {};
  const attachmentUrl = resolveAttachmentUrl(msg.attachment_url);
  const { roomId, text } = parseMessageBody(msg.body);
  const { time, full } = formatMessageTimes(msg.created_at);
  return {
    reactions: Object.values(reactionsMap),
    myReaction: currentUserId ? reactionsMap[String(currentUserId)] : undefined,
    attachmentUrl,
    roomId,
    text,
    time,
    fullTime: full,
    badgeTarget: pickBadgeTarget({
      roomPreview: roomId !== null,
      text: text !== "",
      attachment: attachmentUrl !== null,
    }),
  };
}
