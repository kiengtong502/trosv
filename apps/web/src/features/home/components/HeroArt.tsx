import { ART_ASSETS } from "@/shared/constants/assets";

/* A small colourful town at night, at the right of the hero. Wide screens only. */
export function HeroArt() {
  return (
    <div
      data-testid="hero-art"
      aria-hidden="true"
      className="pointer-events-none absolute right-5 top-1/2 hidden h-[200px] w-[320px] -translate-y-1/2 min-[1180px]:block"
    >
      <img src={ART_ASSETS.HERO_TOWN} alt="" width={320} height={200} className="size-full" />
    </div>
  );
}
