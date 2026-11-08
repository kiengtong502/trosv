/*
  Pure layout rules for a chat thread: day/time separators and how consecutive
  messages cluster into groups. No React, so the rules are unit-tested.
*/

/** A silence this long gets a time separator above the next message. */
export const TIME_GAP_MS = 20 * 60 * 1000;
/** Messages from the same sender closer than this belong to one cluster. */
export const CLUSTER_MS = 3 * 60 * 1000;

export type BubbleShape = "single" | "first" | "middle" | "last";

export interface LayoutMessage {
  created_at: string;
  is_mine?: boolean | undefined;
  reactions?: Record<string, string> | null | undefined;
}

export interface RowLayout {
  /** First message of a calendar day: show a day separator. */
  newDay: boolean;
  /** Same day, but a long silence since the previous message: show the time. */
  showTimeGap: boolean;
  groupedWithPrev: boolean;
  groupedWithNext: boolean;
  shape: BubbleShape;
  /** Last bubble of its cluster: the one that shows a timestamp by default. */
  lastInCluster: boolean;
  /** The previous message carries reactions, so this row needs extra room. */
  prevHasReactions: boolean;
}

export function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Hôm nay";
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function shapeOf(prev: boolean, next: boolean): BubbleShape {
  if (prev && next) return "middle";
  if (next) return "first";
  if (prev) return "last";
  return "single";
}

/** Layout of message `index` within `messages`. */
export function layoutRow(messages: readonly LayoutMessage[], index: number): RowLayout {
  const m = messages[index];
  if (!m) throw new RangeError(`no message at index ${String(index)}`);
  const prev = messages[index - 1];
  const next = messages[index + 1];
  const at = new Date(m.created_at).getTime();

  const sincePrev = prev ? at - new Date(prev.created_at).getTime() : 0;
  const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
  const showTimeGap = !newDay && sincePrev >= TIME_GAP_MS;
  const groupedWithPrev =
    !newDay && !showTimeGap && prev.is_mine === m.is_mine && sincePrev < CLUSTER_MS;

  const toNext = next ? new Date(next.created_at).getTime() - at : 0;
  const groupedWithNext =
    next !== undefined &&
    dayKey(next.created_at) === dayKey(m.created_at) &&
    toNext < TIME_GAP_MS &&
    next.is_mine === m.is_mine &&
    toNext < CLUSTER_MS;

  return {
    newDay,
    showTimeGap,
    groupedWithPrev,
    groupedWithNext,
    shape: shapeOf(groupedWithPrev, groupedWithNext),
    lastInCluster: !groupedWithNext,
    prevHasReactions: Object.keys(prev?.reactions ?? {}).length > 0,
  };
}
