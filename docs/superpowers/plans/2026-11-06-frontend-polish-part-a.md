# Frontend Polish, Part A (Look and Feel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every page the warm palette and the navy "plate" band, a clearer listing card, and purposeful motion, without changing behaviour or backend.

**Architecture:** All colour, shadow and motion decisions live as tokens/utilities in `apps/web/src/styles.css`. One shared `PlateBand` component (three sizes) replaces ad-hoc page headers. Motion reuses the existing `@layer utilities` block plus two tiny hooks/components; no new dependencies.

**Tech Stack:** React 18, Vite, Tailwind v4 (`@theme` tokens), Radix, lucide-react, Playwright (e2e is the only test runner in `apps/web`).

**Spec:** `docs/superpowers/specs/2026-11-06-frontend-polish-design.md` (Part A = sections 4.1 to 4.4). Part B (section 5) gets its own plan after this ships. Section 4.5 (map tiles) is out of scope.

## Global Constraints

- Work in `apps/web`. No new npm dependencies.
- Light tokens (spec 4.1): paper `#fbf8f1`, card `#fffdf9`, tint `#f2ebdf`, line `#e9e0d1`, line-strong `#c9bca7`, ink `#1c1915`, ink-2 `#3a352d`, muted `#6a6254`, moss `#4f6b35`, moss-tint `#e4ecd6`. plate, flyer, danger unchanged.
- Band: gradient `#17479e` to `#123b86`, white text, keyword highlight in flyer yellow.
- Card shadow resting `0 1px 2px rgb(60 40 10/.06), 0 4px 14px -6px rgb(60 40 10/.12)`; hover lift 4px, image zoom 1.05.
- Keep Vietnamese copy. Keep existing headings/copy (Home h1 stays "Phòng trọ. Căn hộ. Gần trường."); do not add claims the app cannot back (no "verified", "fair price", reply-time text in Part A).
- All motion honours the existing `prefers-reduced-motion` block in `styles.css`; content must stay visible if animation never runs.
- Preserve selectors used by e2e: `data-testid="listing-card-{id}"`, the heart's `aria-label`/`aria-pressed`, `main h1`, header/rail landmarks.
- Contrast: body text AA (4.5:1) on paper/card/band; tap targets at least 40px on mobile for anything new.
- Dark mode: warm the neutrals slightly and use a deeper navy band (my call; exact dark values left to the builder, must pass AA).
- Quality gates every task: `npm run typecheck && npm run lint` in `apps/web`.
- Dev stack for tests: Vite on `:5173`, API on `:8000` (Docker compose with `SEED_ON_BOOT=1`). If Playwright's Chromium is missing: `npx playwright install chromium`.

## Review Focus

- Listing with `cover_image: null` (placeholder art): redesigned card and image fade-in must still render it, no collapsed height.
- Image that fails to load (`onError`): fade-in must not leave it at opacity 0 or shift layout.
- Very long title (200 chars) and long address: clamp/truncate, card height stays aligned in the grid.
- Reveal/stagger elements when IntersectionObserver never fires, or with reduced motion: content must be visible.
- 375px-wide viewport and dark mode: band does not overflow, text keeps AA contrast.

---

## File Structure

- Modify `src/styles.css`: tokens, shadow/band tokens, new motion utilities.
- Create `src/ui/plate-band.tsx`: shared band.
- Create `src/components/ListingCardSkeleton.tsx`: card-shaped skeleton.
- Create `src/hooks/useReveal.ts`: scroll-reveal.
- Modify `src/components/ListingCard.tsx`, `src/components/shell.tsx` (footer, route fade), `src/pages/{Home,Favorites,Profile,LandlordDashboard,LandlordForm,AiRoommates,AiAreaSuggestions,RoomDetail,Search,Login,Register,MessagesList}.tsx`, `src/components/AuthSplit.tsx`, `src/pages/search/SearchFilterBar.tsx`, `src/pages/messages/MessageBubble.tsx`.
- Create tests under `e2e/design/`.

### Task 1: Warm tokens, shadows, band tokens

**Files:** Modify `src/styles.css`, `src/pages/Home.tsx` (hardcoded hero colours); Test `e2e/design/tokens.spec.ts`.

**Interfaces:** Produces CSS variables `--color-plate-band-from`, `--color-plate-band-to`, `--shadow-seam`, `--shadow-card`, `--shadow-card-hover` (light and `.dark`), exposed in `@theme` so Tailwind classes `shadow-card`, `shadow-card-hover`, `bg-band` work (define `--background-image-band` or equivalent utility).

- [ ] **Step 1: Write failing test** `tokens.spec.ts`: load `/`, assert `getComputedStyle(document.documentElement).getPropertyValue("--color-paper").trim() === "#fbf8f1"` and the same for `--color-ink` (`#1c1915`) and `--color-moss` (`#4f6b35`); toggle `.dark` on `<html>` and assert `--color-paper` differs from the light value; assert contrast ratio of `--color-muted` on `--color-paper` is at least 4.5 (compute from hex in the test).
- [ ] **Step 2:** Run `npx playwright test e2e/design/tokens.spec.ts`. Expected: FAIL (old values).
- [ ] **Step 3:** Update `:root`/`.dark` token values and add the new tokens in `styles.css`; mirror them in `@theme`. Replace `bg-[#FAF8F5] dark:bg-[#0c1017]` in `Home.tsx` (hero section and the mobile hero image) with token classes.
- [ ] **Step 4:** Re-run the spec. Expected: PASS. Run `npm run typecheck && npm run lint`.
- [ ] **Step 5:** Run the existing e2e suite (`npm run test:e2e`) to confirm no selector regressions. Commit `feat(web): warm design tokens`.

### Task 2: PlateBand component

**Files:** Create `src/ui/plate-band.tsx`; Test `e2e/design/plate-band.spec.ts` (exercised through Task 4's pages, so write the test there; this task adds only the component and a typecheck).

**Interfaces:** Produces
`PlateBand(props: { size: "hero" | "strip" | "header"; title?: React.ReactNode; highlight?: string; description?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode; className?: string }): JSX.Element`
Renders `<section data-testid="plate-band" data-size={size}>` with the navy gradient (`bg-band`), white text, `highlight` wrapped in a flyer-yellow `<mark>` inside the `<h1>` (title rendered as `<h1>` only for `header`/`hero`; `strip` renders no heading). Heights: header about 120px, strip about 64px, hero min 420px on `md`+ (children fill the hero). Seam shadow `--shadow-seam`.

- [ ] **Step 1:** Implement the component in `src/ui/plate-band.tsx` using `cn`, existing tokens and the Task 1 band classes. Stack vertically and stay within `max-w-6xl px-4 sm:px-6` like page containers.
- [ ] **Step 2:** `npm run typecheck && npm run lint`. Expected: clean. Commit `feat(web): PlateBand component`.

### Task 3: Home hero and alignment

**Files:** Modify `src/pages/Home.tsx`; Test `e2e/design/home.spec.ts`.

- [ ] **Step 1: Failing test** `home.spec.ts`: at viewport 1360x900, `/` has `[data-testid="plate-band"][data-size="hero"]` containing the `h1` with text "Gần trường."; the hero art `img` bounding box right edge is at most the viewport width and its left edge is at least 0; the first `listing-card-*` card left edge equals the "Mới đăng" heading left edge (within 1px).
- [ ] **Step 2:** Run it; expect FAIL.
- [ ] **Step 3:** Wrap the hero in `PlateBand size="hero"` (keep `HeroSearch`, keep the h1 copy, keep the mobile art). Anchor the desktop art right with `object-position: right center` so tiles are not clipped. Remove the carousel's `-mx-5 px-5` offset or equivalently pad its scroll container so the first card aligns with the heading. Style quick-filter pills on cream with the same shape.
- [ ] **Step 4:** Run spec; expect PASS. Check the smoke spec still passes.
- [ ] **Step 5:** Commit `feat(web): sign-blue Home hero`.

### Task 4: Compact page headers

**Files:** Modify `Favorites.tsx`, `Profile.tsx`, `LandlordDashboard.tsx`, `LandlordForm.tsx`, `StudentPublic.tsx`, `MessagesList.tsx`; Test `e2e/design/plate-band.spec.ts`.

- [ ] **Step 1: Failing test:** logged in as `student1@example.com`, `/favorites` and `/profile` each show one `[data-testid="plate-band"][data-size="header"]` whose `h1` text is "Phòng đã lưu" / the user's name; as `landlord1@example.com`, `/landlord` and `/landlord/new` show `data-size="header"` with "Quản lý tin đăng" / "Đăng tin mới". Chat route `/messages/{id}` has no `plate-band`. At 375px width, no element's `scrollWidth` exceeds `clientWidth` for the band.
- [ ] **Step 2:** Run it; expect FAIL.
- [ ] **Step 3:** Replace each page's local `<h1>` block with `<PlateBand size="header" title=... description=... actions=...>`, moving existing action buttons (e.g. "Đăng tin mới", "Xem trang cá nhân công khai") into `actions`. Keep guest/empty gates (e.g. the signed-out Favorites gate) without a band. For `MessagesList`, the list pane gets a navy pane header only; the conversation thread gets a navy conversation header and no band.
- [ ] **Step 4:** Run spec and the e2e `auth`, `chat` suites; expect PASS.
- [ ] **Step 5:** Commit `feat(web): plate band page headers`.

### Task 5: AI pages and Room detail band

**Files:** Modify `AiRoommates.tsx`, `AiAreaSuggestions.tsx`, `RoomDetail.tsx`; Test extend `plate-band.spec.ts`.

- [ ] **Step 1: Failing test:** `/ai/area-suggestions` and `/ai/roommates` show a band with `data-size="header"` and a `mark` highlight; `/rooms/{id}` shows a band whose bottom edge sits above the gallery's bottom edge (gallery overlaps) and the page `h1` is the listing title.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** AI pages: `PlateBand size="header"` with a yellow `highlight` keyword (e.g. "phù hợp", "cùng phòng"), widths aligned with the other pages. Room detail: short band behind back link and title, gallery overlapping its lower edge via negative margin; keep the price and contact card unchanged.
- [ ] **Step 4:** Run spec and `e2e/listings`; expect PASS.
- [ ] **Step 5:** Commit `feat(web): band on AI and room detail pages`.

### Task 6: Search strip

**Files:** Modify `Search.tsx`, `SearchFilterBar.tsx`; Test `e2e/design/search.spec.ts`.

- [ ] **Step 1: Failing test:** `/rooms` has `[data-testid="plate-band"][data-size="strip"]` with height at most 80px that contains the search input and filter buttons; the map container's top edge is within 140px of the viewport top at 1360x900; existing `school-ward-filter.spec.ts` still passes.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Put the existing filter bar inside `PlateBand size="strip"`; restyle `FilterPill` and the input for a navy background (white-on-navy inactive, yellow/white active) while keeping `aria-label`s and Popover behaviour.
- [ ] **Step 4:** Run new spec plus `e2e/listings`; expect PASS.
- [ ] **Step 5:** Commit `feat(web): navy search strip`.

### Task 7: Auth split and footer

**Files:** Modify `AuthSplit.tsx`, `Login.tsx`, `Register.tsx`, `Footer` in `shell.tsx`; Test extend `plate-band.spec.ts`.

- [ ] **Step 1: Failing test:** `/login` contains a navy panel element (`data-testid="auth-panel"`) beside the form; footer has `data-testid="site-footer"` whose computed background equals `--color-plate-band-to`; `e2e/auth/login-loop.spec.ts` unchanged and passing.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Apply the navy panel to the art side of `AuthSplit`; restyle the footer navy with legible links (AA on navy).
- [ ] **Step 4:** Run spec and `e2e/auth`; expect PASS.
- [ ] **Step 5:** Commit `feat(web): navy auth panel and footer`.

### Task 8: Listing card hierarchy

**Files:** Modify `ListingCard.tsx`; Test `e2e/design/card.spec.ts`.

- [ ] **Step 1: Failing test:** on `/rooms`, a card's title font-weight is at least 700 and font-size at least 16px; address font-size at most 13px; card has a non-`none` resting `box-shadow`; hovering lifts it by about 4px (`transform` matrix translateY of -4); two cards in the same grid row have equal height even when one title is clamped to two lines.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** In `ListingCard`: title up to two lines (`line-clamp-2`, `min-h` for two lines), address one line truncated, area and distance as small pills with rating at the right of the row, `shadow-card hover:shadow-card-hover`, hover lift 4px, image `group-hover:scale-[1.05]`. Keep `data-testid`, heart markup, `actionSlot`.
- [ ] **Step 4:** Run spec plus `e2e/listings` and `e2e/chat`; expect PASS.
- [ ] **Step 5:** Commit `feat(web): clearer listing card`.

### Task 9: Card skeleton and staggered entry

**Files:** Create `src/components/ListingCardSkeleton.tsx`; Modify `Home.tsx`, `Search.tsx`, `styles.css`; Test `e2e/design/motion.spec.ts`.

**Interfaces:** Produces `ListingCardSkeleton(props: { className?: string }): JSX.Element` (same outer size and border as the card). Produces utility `.motion-stagger > *` applying `fade-up` with `animation-delay: calc(var(--i, 0) * 50ms)`, delay capped at 400ms; ListingCard grids set `style={{"--i": index}}`.

- [ ] **Step 1: Failing test:** with the listings request delayed (`page.route` delaying `**/api/listings*` by 1s), `/rooms` shows `[data-testid="listing-skeleton"]` elements whose box matches a card's width; after load, at least 3 cards have `animation-name: fade-up`; with `page.emulateMedia({ reducedMotion: "reduce" })` the cards are visible (opacity 1) immediately.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement the skeleton and stagger; replace `ListingCardSkeleton` in `Home.tsx` and the `<Skeleton className="h-72" />` uses in `Search.tsx` (and `PageFallback` if it fits).
- [ ] **Step 4:** Run spec; expect PASS.
- [ ] **Step 5:** Commit `feat(web): card skeleton and staggered entry`.

### Task 10: Route fade, image fade-in, scroll reveal

**Files:** Create `src/hooks/useReveal.ts`; Modify `shell.tsx` (route fade + scroll to top), `ListingCard.tsx` (image fade-in), `Home.tsx` (reveal sections), `styles.css`; Test extend `motion.spec.ts`.

**Interfaces:** Produces `useReveal<T extends HTMLElement>(): React.RefObject<T>` that sets `data-revealed="true"` once the element enters the viewport (IntersectionObserver, once); CSS `.motion-reveal` starts at `opacity:0; translateY(8px)` only when JS flags `html.js-motion` and reduced-motion is not set, and is visible otherwise. Route fade applies `motion-fade-up` to the `<main>` child keyed by `location.pathname`; `window.scrollTo(0, 0)` on path change.

- [ ] **Step 1: Failing test:** navigating Home to `/rooms` resets `window.scrollY` to 0 and the new page root has `animation-name: fade-up`; a card image has `opacity: 1` after load and still has `opacity: 1` when its `src` is forced to 404 (route abort) and when `cover_image` is null; "Mới đăng" section carries `data-revealed="true"` after scrolling into view; with reduced motion all sections are visible immediately.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Implement as specified. Image fade uses `onLoad` to add a class; `onError` also clears the hidden state. Never leave content at opacity 0 without the `js-motion` flag.
- [ ] **Step 4:** Run spec; expect PASS.
- [ ] **Step 5:** Commit `feat(web): route fade, image fade-in, scroll reveal`.

### Task 11: Heart pop, chat entrance, small feedback

**Files:** Modify `ListingCard.tsx`, `MessageBubble.tsx`, `Search.tsx` (mobile tab), pagination buttons in `Search.tsx`, `styles.css`; Test extend `motion.spec.ts`.

- [ ] **Step 1: Failing test:** as a student, clicking a card's heart sets `aria-pressed="true"` and the heart icon gets `animation-name: heart-pop` for about 450ms; a newly sent chat message (in the existing chat e2e flow) has `animation-name: fade-up`; pagination buttons have an `:active` scale transform; heart still toggles back with `aria-pressed="false"`.
- [ ] **Step 2:** Run; expect FAIL.
- [ ] **Step 3:** Add `@keyframes heart-pop` (scale 1, 1.5, 1 with a springy ease) and `.motion-heart-pop`; apply to the heart only on the transition to favourited. Apply `fade-up` to newly appended `MessageBubble`s only (not on initial history render). Add `.motion-press` to pagination buttons and a short fade between the mobile Map/List panes.
- [ ] **Step 4:** Run spec plus `e2e/chat`; expect PASS.
- [ ] **Step 5:** Commit `feat(web): heart pop and small motion`.

### Task 12: Verification pass

- [ ] **Step 1:** Run `npm run typecheck && npm run lint && npm run format:check && npm run test:e2e` in `apps/web`. Expected: all green. Fix formatting with `npm run format` if needed.
- [ ] **Step 2:** Screenshot every changed page at 1360px and 375px, light and dark, with a Playwright script against `localhost:5173` (log in as `student1` and `landlord1`, password `password`). Check for clipping, contrast and overflow; fix and recommit.
- [ ] **Step 3:** Run `npm run build`. Expected: succeeds, no new bundle warnings.
- [ ] **Step 4:** Report any deviation from the spec to the owner; list what Part B inherits (tokens, `PlateBand`, motion utilities).

## Self-review notes

- Spec 4.1 to Task 1; 4.2 to Tasks 2 to 7; 4.3 to Task 8 (verdict pill and trust line deliberately deferred to Part B/backend); 4.4 items 1 and 5 and 6 to Task 10, 2 and 3 to Task 9, 4 and 7 and 8 to Task 11. Optional View Transitions item is deferred. Map tiles (4.5) out of scope.
- Interface names used across tasks: `PlateBand` (`size`, `title`, `highlight`, `description`, `actions`), `ListingCardSkeleton`, `useReveal`, `.motion-stagger`, `.motion-reveal`, `.motion-heart-pop`, `data-testid` values `plate-band`, `listing-skeleton`, `auth-panel`, `site-footer`.
