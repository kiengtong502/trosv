import { useCallback, useRef } from "react";

/*
  Scroll-reveal: returns a ref callback. The element starts as
  data-reveal="pending" (hidden by CSS, only when motion is allowed) and flips
  to "done" once it scrolls into view. A timer flips it anyway, so content can
  never stay hidden if IntersectionObserver is missing or never fires.
*/
const FALLBACK_MS = 1500;

export function useReveal(): (el: HTMLElement | null) => void {
  const cleanup = useRef<(() => void) | null>(null);

  return useCallback((el: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!el || typeof IntersectionObserver === "undefined") return;

    el.dataset["reveal"] = "pending";
    const done = () => {
      el.dataset["reveal"] = "done";
      cleanup.current?.();
      cleanup.current = null;
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) done();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    const timer = window.setTimeout(done, FALLBACK_MS);
    cleanup.current = () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);
}
