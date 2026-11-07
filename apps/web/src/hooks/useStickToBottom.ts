import { useEffect, useRef, useCallback } from "react";
import type { RefObject } from "react";

const NEAR_BOTTOM_THRESHOLD = 150;

function getDistanceToBottom(el: HTMLElement): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight;
}

/**
 * Autoscroll for chat threads:
 * - On initial thread load or conversation switch: immediately scroll to the bottom
 *   so the user always sees the latest messages first.
 * - Follow new content and layout expansions (e.g. room preview cards, images)
 *   ONLY while the user was at the bottom just before the content grew. That is
 *   remembered from scroll events, because after growth the distance is already
 *   larger and can no longer tell us.
 * - If the user scrolls up to read history or interact with older messages,
 *   never yank their view.
 */
export function useStickToBottom(
  threadRef: RefObject<HTMLDivElement>,
  messages: unknown,
  loaded: boolean,
  conversationId?: string | number  
): {
  handleScroll: () => boolean;
  scrollToBottom: (smooth?: boolean) => void;
  notifyMounted: (el: HTMLDivElement) => void;
} {
  const prevConvIdRef = useRef<string | number | undefined>(conversationId);
  const initialScrollDoneRef = useRef(false);
  const roRef = useRef<ResizeObserver | null>(null);
  /** Was the reader at the bottom as of the last scroll? True until they scroll up. */
  const atBottomRef = useRef(true);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = threadRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [threadRef]);

  /* Content growth changes the children's size, not the scroll box's own size. */
  const observeChildren = useCallback((el: HTMLElement) => {
    const ro = roRef.current;
    if (!ro) return;
    for (const child of Array.from(el.children)) ro.observe(child);
  }, []);

  const attachObserver = useCallback((el: HTMLDivElement) => {
    if (typeof ResizeObserver === "undefined") return;
    if (roRef.current) {
      roRef.current.disconnect();
    }
    const ro = new ResizeObserver(() => {
      // Keep pinned if the first scroll has not settled, or the reader was at the bottom
      // before this growth (room preview cards and images load after the first paint).
      if (!initialScrollDoneRef.current || atBottomRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    });
    ro.observe(el);
    roRef.current = ro;
    observeChildren(el);
  }, [observeChildren]);

  const notifyMounted = useCallback((el: HTMLDivElement) => {
    attachObserver(el);

    if (!initialScrollDoneRef.current) {
      el.scrollTop = el.scrollHeight;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
        initialScrollDoneRef.current = true;
      });
    }
  }, [attachObserver]);

  // When conversation ID switches, reset initial scroll flag
  useEffect(() => {
    if (conversationId !== prevConvIdRef.current) {
      prevConvIdRef.current = conversationId;
      initialScrollDoneRef.current = false;
      atBottomRef.current = true;
      if (threadRef.current) {
        notifyMounted(threadRef.current);
      }
    }
  }, [conversationId, notifyMounted, threadRef]);

  // When messages or loaded status change:
  useEffect(() => {
    const el = threadRef.current;
    if (!el || !loaded) return;

    if (!initialScrollDoneRef.current) {
      notifyMounted(el);
      return;
    }

    // New rows must be watched too, so their late growth is followed.
    observeChildren(el);
    // Only stick to bottom if user is already at the bottom
    const dist = getDistanceToBottom(el);
    if (atBottomRef.current || dist < 60) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loaded, conversationId, notifyMounted, observeChildren, threadRef]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
    };
  }, []);

  function handleScroll(): boolean {
    const el = threadRef.current;
    if (!el) return false;
    const distanceToBottom = getDistanceToBottom(el);
    atBottomRef.current = distanceToBottom < 30;
    return distanceToBottom < NEAR_BOTTOM_THRESHOLD;
  }

  return {
    handleScroll,
    scrollToBottom,
    notifyMounted,
  };
}
