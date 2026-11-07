import type { ReactNode } from "react";

/*
  Three hand-drawn "room cards" fanned out and gently floating at the right of
  the hero. Pure decoration (no real listings, no links): each is a small
  illustrated scene, so the hero never shows half-loaded photos and looks the
  same for everyone. Hidden from screen readers.

  A fixed-size cluster (not a percentage of the screen) so it looks identical
  on every display. The middle card sits higher and on top.
*/

const INK = "#1b2a4a";
const STROKE = { stroke: INK, strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Bedroom() {
  return (
    <svg viewBox="0 0 188 141" className="size-full" {...STROKE}>
      <rect width="188" height="141" fill="#cfe3ff" stroke="none" />
      <rect y="106" width="188" height="35" fill="#e8cfa6" stroke="none" />
      <path d="M0 106h188" fill="none" />
      <rect x="116" y="20" width="46" height="48" rx="3" fill="#fffdf9" />
      <path d="M139 20v48M116 44h46" fill="none" />
      <path d="M124 30l6 6M146 54l8 8" stroke="#8fb4ee" fill="none" />
      <rect x="14" y="62" width="9" height="50" rx="2" fill="#c9783f" />
      <rect x="23" y="84" width="92" height="28" rx="4" fill="#fffdf9" />
      <path d="M52 84h63v28H52z" fill="#e4572e" />
      <rect x="27" y="74" width="26" height="12" rx="6" fill="#fffdf9" />
      <rect x="126" y="92" width="30" height="20" rx="2" fill="#c9783f" />
      <path d="M133 92l3-14h14l3 14z" fill="#ffd23f" />
      <path d="M141 78v-6" fill="none" />
      <path d="M56 124c12 6 40 6 64 0" stroke="#e4572e" fill="none" />
    </svg>
  );
}

function House() {
  return (
    <svg viewBox="0 0 188 141" className="size-full" {...STROKE}>
      <rect width="188" height="141" fill="#d6ecff" stroke="none" />
      <circle cx="158" cy="26" r="11" fill="#ffd23f" />
      <path d="M0 112c40-8 100-10 188-2v31H0z" fill="#a6d48f" stroke="none" />
      <path d="M0 112c40-8 100-10 188-2" fill="none" />
      <rect x="150" y="44" width="10" height="22" fill="#e4572e" transform="translate(-50 -6)" />
      <rect x="54" y="66" width="82" height="48" rx="2" fill="#fff3d6" />
      <path d="M44 68L95 28l51 40z" fill="#e4572e" />
      <rect x="84" y="86" width="22" height="28" rx="3" fill="#c9783f" />
      <circle cx="101" cy="101" r="1.6" fill={INK} />
      <rect x="62" y="78" width="16" height="16" rx="2" fill="#cfe3ff" />
      <rect x="112" y="78" width="16" height="16" rx="2" fill="#cfe3ff" />
      <circle cx="28" cy="82" r="17" fill="#6fb35a" />
      <path d="M28 98v18" fill="none" />
      <path d="M150 116V96h24v14l-24 6" fill="#ffd23f" transform="translate(0 -4)" />
    </svg>
  );
}

function Desk() {
  return (
    <svg viewBox="0 0 188 141" className="size-full" {...STROKE}>
      <rect width="188" height="141" fill="#ffe3c7" stroke="none" />
      <rect x="16" y="16" width="50" height="40" rx="2" fill="#e8cfa6" />
      <rect x="24" y="23" width="14" height="12" fill="#ffd23f" />
      <rect x="42" y="23" width="14" height="12" fill="#fffdf9" />
      <rect x="28" y="38" width="16" height="12" fill="#cfe3ff" />
      <circle cx="31" cy="23" r="1.4" fill={INK} stroke="none" />
      <rect x="124" y="18" width="44" height="44" rx="22" fill="#cfe3ff" />
      <path d="M156 26a14 14 0 1 0 6 18 11 11 0 0 1-6-18z" fill="#ffd23f" />
      <rect x="10" y="96" width="168" height="10" rx="3" fill="#c9783f" />
      <path d="M22 106v28M166 106v28" fill="none" />
      <rect x="60" y="84" width="54" height="12" rx="2" fill="#dfe3ea" />
      <path d="M66 84l6-26h36l6 26" fill="#fffdf9" />
      <path d="M78 70h20" stroke="#8fb4ee" fill="none" />
      <rect x="20" y="78" width="30" height="18" rx="2" fill="#e4572e" />
      <rect x="24" y="66" width="26" height="12" rx="2" fill="#6fb35a" />
      <rect x="126" y="80" width="18" height="16" rx="3" fill="#fffdf9" />
      <path d="M144 84h6v7h-6" fill="none" />
      <path d="M156 96l-3-14M156 96l7-12M156 96l-9-6" fill="none" stroke="#3f8f3a" />
    </svg>
  );
}

const CARDS: { place: string; art: ReactNode; tag: string }[] = [
  { place: "left-0 top-[84px] -rotate-6", art: <Bedroom />, tag: "bg-flyer" },
  { place: "left-[140px] top-0 rotate-2 z-10", art: <House />, tag: "bg-moss" },
  { place: "left-[280px] top-[84px] rotate-6", art: <Desk />, tag: "bg-plate" },
];

export function HeroDeck() {
  return (
    <div
      data-testid="hero-deck"
      aria-hidden="true"
      className="pointer-events-none absolute right-5 top-1/2 hidden h-[290px] w-[468px] -translate-y-1/2 min-[1180px]:block"
    >
      <div className="relative size-full">
        {CARDS.map((c, i) => (
          <div
            key={i}
            data-testid="hero-deck-card"
            className={`motion-float absolute w-[188px] overflow-hidden rounded-xl border border-line bg-card shadow-pop ${c.place}`}
            style={{ animationDelay: `${-i * 2}s` }}
          >
            <div className="aspect-4/3">{c.art}</div>
            <div className="flex items-center gap-2 px-3 py-3">
              <span className={`h-3 w-9 rounded-full ${c.tag}`} />
              <span className="h-2 flex-1 rounded-full bg-sunken" />
            </div>
            <div className="px-3 pb-3">
              <span className="block h-2 w-3/4 rounded-full bg-sunken" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
