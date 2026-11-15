import { ART_ASSETS } from "@/shared/constants/assets";

/*
  Backdrop for the navy brand band (Home hero, login, register): a diagonal
  blue gradient with the quiet icon pattern drifting slowly across it. The
  drift is disabled for people who prefer reduced motion (see .band-doodles).
*/
export function BandBackdrop({ testId }: { testId?: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0" data-testid={testId}>
      <div className="band-gradient absolute inset-0" />
      <div
        className="band-doodles absolute inset-0"
        style={{ backgroundImage: `url(${ART_ASSETS.HERO_DOODLES})` }}
      />
    </div>
  );
}
