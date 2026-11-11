import { useEffect, useState } from "react";

/** The phrases the hero keyword types out, one after another. */
export const HERO_WORDS = ["Gần trường.", "Giá rẻ.", "Tiện lợi."] as const;

interface Phase {
  word: number;
  len: number;
  deleting: boolean;
}

const START: Phase = { word: 0, len: 0, deleting: false };

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The yellow hero keyword: types a phrase, holds it, deletes it, then types
 * the next one, with a blinking caret. Screen readers get the whole list once
 * (sr-only) instead of single letters. With reduced motion it just shows the
 * first phrase.
 */
export function TypedWord() {
  const [reduced] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState<Phase>(START);

  useEffect(() => {
    if (reduced) return;
    const word = HERO_WORDS[phase.word] ?? HERO_WORDS[0];
    let delay: number;
    let next: Phase;
    if (!phase.deleting) {
      if (phase.len < word.length) {
        delay = 80 + ((phase.len * 7) % 4) * 18;
        next = { ...phase, len: phase.len + 1 };
      } else {
        delay = 1500;
        next = { ...phase, deleting: true };
      }
    } else if (phase.len > 0) {
      delay = 45;
      next = { ...phase, len: phase.len - 1 };
    } else {
      delay = 320;
      next = { word: (phase.word + 1) % HERO_WORDS.length, len: 0, deleting: false };
    }
    const id = setTimeout(() => {
      setPhase(next);
    }, delay);
    return () => {
      clearTimeout(id);
    };
  }, [phase, reduced]);

  const word = HERO_WORDS[phase.word] ?? HERO_WORDS[0];
  const shown = reduced ? HERO_WORDS[0] : word.slice(0, phase.len);
  const idle =
    !reduced &&
    ((!phase.deleting && phase.len === word.length) || (phase.deleting && phase.len === 0));

  return (
    <>
      <span className="sr-only">Gần trường, giá rẻ, tiện lợi.</span>
      <span aria-hidden="true" data-testid="typed-word" className="whitespace-nowrap text-flyer">
        {shown}
        {reduced ? null : (
          <span
            data-testid="typed-caret"
            className={idle ? "typed-caret typed-caret-idle" : "typed-caret"}
          />
        )}
      </span>
    </>
  );
}
