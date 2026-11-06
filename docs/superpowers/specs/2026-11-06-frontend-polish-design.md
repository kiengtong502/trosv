# TROSV Frontend Polish: Design

Date: 2026-11-06
Scope: `apps/web` (React 18, Vite, Tailwind v4, Radix, Leaflet)
Status: Approved by owner (open questions resolved, see section 8)

## 1. Intent and why

The frontend works and is coherent, but nothing in it makes a student *love*
it. Looking at the running app, four causes stand out:

1. **Two colour worlds.** The hero art is warm (cream, terracotta, olive,
   purple, sunny yellow) but the interface around it is cool grey and navy.
   The art looks pasted on.
2. **Flat hierarchy.** Listing cards have one visual accent (the price tab);
   title, address, area and rating are all the same small size. Cards have no
   resting shadow.
3. **Abrupt interactions.** Route changes, search results, favouriting, image
   loads and new chat messages all change instantly. `motion-fade-up` and the
   `fade-up` keyframe exist in `styles.css` but nothing uses them.
4. **Best features are buried and several pages are unfriendly.** AI price
   advice, roommate matching and area suggestions are what no competitor has,
   yet they sit behind a small bot button and plain forms. The hobbies picker
   (inside Profile) is the clearest example.

Target feeling, as a hypothesis the owner has not yet confirmed in their own
words: *"Finally, a room site that tells me if the price is fair, and I don't
feel like I'm being scammed."* Trust, warmth and a little delight.

## 2. Decisions already made (by the owner)

- Direction: **Polish** (keep the street-sign blue + flyer yellow identity;
  fix execution), not a rebrand and not the bolder sign-plate overhaul.
- Palette: the **"warm + hero colours"** variant, with the **"sign-blue hero"**
  (variant 3b) as the signature element: a navy plate band with white text and
  a yellow-highlighted keyword.
- The navy band treatment applies **across the site**, not only on Home.
- The UX of other pages must be improved too, starting with the hobbies /
  profile flow.
- Scope is Parts A and B below, designed together.

A throwaway preview of the palette and Home layout exists in the session
scratchpad (not in the repo). It is a reference for look and feel only, not
product code.

## 3. Goals, non-goals, anti-goals

### Goals
- One coherent warm visual system in light mode, expressed through existing
  design tokens in `src/styles.css`.
- A consistent page-header "plate" element at three sizes (see 4.2).
- Clear card hierarchy and tasteful motion that respects
  `prefers-reduced-motion`.
- Profile, hobbies, AI pages, landlord form/dashboard and room detail redesigned
  for clarity and for showing the value of each action.

### Non-goals
- Switching to Google Maps (decided against for now; see 6).
- New backend features in Part A.
- A new component library or animation dependency.
- Redesigning chat message bubbles beyond entrance motion.

### Anti-goals (would make this a failure even if it "works")
- Heavier pages or slower first paint (no large animation libs, no layout
  shift from skeletons or reveals).
- Motion that is decorative noise, or that ignores reduced-motion.
- A navy band so tall on functional pages (Search, Messages) that it costs the
  map, list or conversation their space.
- Breaking existing Playwright specs in `apps/web/e2e/` (selectors and
  `data-testid`s such as `listing-card-{id}` must survive).
- Colour-only meaning, or contrast regressions (WCAG AA for body text).

## 4. Part A: Look and feel (front-end only)

### 4.1 Tokens (`src/styles.css`)
Warm the neutrals; keep plate blue and flyer yellow.

| Token | Now | Proposed (light) |
|---|---|---|
| paper | `#f5f6f8` | `#fbf8f1` |
| card | `#ffffff` | `#fffdf9` |
| tint | `#eceef2` | `#f2ebdf` |
| line | `#e1e4ea` | `#e9e0d1` |
| line-strong | `#b4bbc7` | `#c9bca7` |
| ink / ink-2 / muted | cool greys | `#1c1915` / `#3a352d` / `#6a6254` |
| moss (good/verified) | `#2e7d5b` | `#4f6b35`, tint `#e4ecd6` (olive from hero art) |
| plate, flyer, danger | unchanged | unchanged |

Add tokens for the band: `--color-plate-band` (navy gradient start/end,
roughly `#17479e` to `#123b86`) and a soft seam shadow. Replace the hardcoded
hero background `#FAF8F5` / `#0c1017` in `Home.tsx` with tokens.

Card shadow: add a soft resting shadow token and a stronger hover shadow
(values in the preview: resting
`0 1px 2px rgb(60 40 10/.06), 0 4px 14px -6px rgb(60 40 10/.12)`).
`--shadow-pop` stays for floating surfaces.

**Dark mode (my call, not decided by the owner):** keep the current dark
structure, warm the neutrals slightly, and use a deeper navy for the band.
Verify contrast. Do not touch the map dark filter in this pass (it looked
acceptable in screenshots).

### 4.2 The plate band (shared component)
**Owner decision (2026-11-06, after seeing it on every page): the navy band is
reserved for three places.** Everything else is a cream page with a plain dark
title (`PageHeader`), so the band stays a brand moment instead of a repeated header.

| Page | Treatment |
|---|---|
| Home | Full hero: large navy band, art on the right (art only from 1300px wide; below that the framed art sits under the text) |
| Search `/rooms` | Slim navy strip (~64px) holding search input and filters; map + cards on cream |
| Login / Register | Split screen; navy panel beside the form, art framed on it |
| Everything else (Favorites, Profile, Landlord pages, AI pages, Room detail, Messages, footer, 404) | Cream page, plain `PageHeader` title (AI pages add a yellow-underlined keyword); no band |

Focus on navy surfaces uses flyer yellow (the plate-blue ring disappears there).

Home hero fixes: art must not clip on common widths (it did at 1360px); art is
positioned right, text on the left. Align the listing carousel left edge with
the content column (it sat ~20px off the heading and chips).

### 4.3 Listing card (`components/ListingCard.tsx`)
- Title heavier (up to two lines), address quieter (one line, truncated).
- Area and distance as small pills; rating on the right of the same row.
- Status/verdict pill (e.g. "Giá hợp lý") and a trust line (verified landlord /
  response time): **only when real data exists** (see Part B, 5.5). Never show
  invented text.
- Resting shadow; hover lift 4px, image zoom 1.05, shadow deepens.
- Keep `data-testid`, the heart's `aria-pressed` and `aria-label` behaviour.

### 4.4 Motion (all existing utilities, no new dependency)
Extend the "TROSV Motion Utilities" layer in `styles.css`.
1. **Route change:** short fade-up on the page container; scroll to top.
2. **Skeletons:** card-shaped skeleton matching the real card.
3. **Results entry:** staggered fade-up on card grids (cap the stagger so long
   lists do not feel slow).
4. **Heart:** pop animation on save, in `ListingCard`.
5. **Images:** fade-in on load, with reserved aspect ratio (no layout shift).
6. **Home sections:** scroll-reveal (IntersectionObserver, once).
7. **Chat:** new message slide/fade in.
8. **Smaller:** mobile Map/List tab transition, pagination press feedback.
Everything honours the existing `prefers-reduced-motion` block.
Optional, deferred: shared-element card-to-detail transition via the View
Transitions API (riskiest; only if time allows).

### 4.5 Map tiles (optional item, needs owner decision)
Keep Leaflet. The public `tile.openstreetmap.org` server is for light use,
shows mixed-script labels, and is plain. Swap to a hosted tile style with
Vietnamese labels and proper light/dark styles (provider TBD: MapTiler,
Stadia or similar; needs an API key and a free-tier check). This removes the
CSS invert filter. Google Places for landlord address autocomplete is a
possible later addition, out of scope here.

## 5. Part B: Usability

Items marked **[backend]** need API/AI-service changes or data that may not
exist; they are listed separately in 7.

### 5.1 Profile and hobbies (`pages/Profile.tsx`, `pages/profile/*`, `components/HobbySelector.tsx`)
Observed: 15 plain `text-xs` pills (~28px tall) in one cloud, no icons, tiny
custom-hobby input, a single Save button at the bottom, sleep/personality/
cleanliness as small controls, no hint of the roommate-matching payoff.
- Larger chips (at least 40px tall), grouped into categories (e.g. sports,
  entertainment, study/tech, lifestyle), with one icon per hobby from a single
  consistent set (lucide-react). The owner approved reversing the earlier
  "no icon" choice on condition that it looks better, not busier (see 8).
- Guidance line: "Chọn 3–8 sở thích để AI ghép chính xác hơn", with a live
  match-quality meter driven only by profile completeness (front-end).
- "+ Khác" chip that expands an inline input for custom hobbies.
- Profile completeness indicator ("Hồ sơ 70%") listing what each missing piece
  unlocks.
- Replace the one bottom Save with a sticky save bar showing dirty state, plus
  a subtle "Đã lưu" confirmation. (Per-field autosave is a builder option if
  the API allows; default is the sticky bar.)
- Larger, clearer controls for sleep schedule, personality, cleanliness (with
  labelled scale), smoking.
- First-time guided flow after registering: 3 skippable steps (school and
  budget, habits, hobbies).
- "12 sinh viên cùng trường có chung sở thích" payoff **[backend]**.

### 5.2 AI pages (`pages/AiAreaSuggestions.tsx`, `pages/AiRoommates.tsx`)
Observed: Area Suggestions is a bare form on an empty page with raw numbers
(`1300000`), a basic dropdown and unlabelled chips.
- Medium plate band with yellow keyword; a sentence on what the AI will do.
- Budget as formatted VND inputs (reuse `formatVndPreview`), optionally a
  range slider.
- School via the existing `SchoolCombobox`, prefilled from the profile.
- Priority chips given a label ("Ưu tiên của bạn") and selected state.
- Results as cards with reasons; friendly loading state and an error state
  that offers retry (the error illustration already exists).
- Roommates page: if profile is incomplete, show the completeness prompt with a
  link instead of an empty/error state.
- Align page widths with the rest of the app.

### 5.3 Landlord form (`pages/LandlordForm.tsx`)
Observed: long single scroll, manual latitude/longitude inputs, raw price
input, dashed upload box.
- Step or anchored-section layout with a progress indicator; keep it one route.
- Map click/drag sets coordinates; geocode-on-address if feasible. Keep lat/lng
  visible but secondary (collapsed "Nâng cao").
- Formatted price input with a market hint **[backend]** if AI price advice is
  available for new listings.
- Upload shows thumbnails with remove/reorder; clearer limits.
- Promote "Viết mô tả giúp tôi" to a clear AI helper action.

### 5.4 Landlord dashboard (`pages/LandlordDashboard.tsx`)
Observed: 12 identical cards, no summary, Delete beside Edit.
- Summary strip at top: counts by status; unread messages (existing unread
  hook). Views/inquiries **[backend]**.
- Delete moves into an overflow menu with a confirm dialog (Radix dialog is
  already available).
- Status filter chips remain; add a search box.

### 5.5 Room detail (`pages/RoomDetail.tsx`, `pages/room/*`)
Observed: price appears three times, plain info table, "Khoảng cách tới
trường: Không rõ", AI price advice hidden behind a button.
- Show the price once, prominently, in the contact card and headline.
- Replace the info table with a compact facts row (area, status, distance) and
  hide rows with no data instead of "Không rõ".
- Surface AI price advice automatically (verdict + range) near the price, with
  the existing button kept for detail. Uses existing `price_min`, `price_max`,
  `price_note` fields where present.
- Gallery handles 1 image, many images, and failed images gracefully.

### 5.6 Messages (`pages/MessagesList.tsx`, `pages/ConversationDetail.tsx`)
- Richer empty state in the right pane.
- Conversation rows show the room thumbnail/title being discussed.
- (Message entrance motion is in 4.4.)

### 5.7 Consistency
Shared page header, consistent max widths and spacing, and one empty/error
state pattern across the pages above.

## 6. Constraints

- Stack: React 18, Vite, Tailwind v4 tokens in `src/styles.css`, Radix, Leaflet.
  Build on what exists; no new animation or UI framework.
- Keep Vietnamese copy; new strings in Vietnamese in the existing voice.
- Existing e2e specs (`apps/web/e2e/**`) must keep passing; update specs only
  where behaviour intentionally changes.
- `npm run lint` (max-warnings 0), `typecheck`, `format:check` must pass.
- Accessibility: keep focus rings, `aria-*` on interactive elements, AA
  contrast, reduced-motion support, tap targets of at least 40px on mobile.
- Dev stack: API at `localhost:8000` via Docker; seed data via `SEED_ON_BOOT=1`;
  demo logins `student1@example.com` / `landlord1@example.com`, password
  `password`.

## 7. Items needing backend or data work (kept out of Part A)

- "Fair price" verdict on cards in lists (vs. area average). Detail-page advice
  already has fields; list endpoints may not.
- Verified-landlord flag and landlord response time.
- Count of students with shared hobbies.
- Landlord listing views/inquiries counts.
- Anything above is shown only when the data exists; otherwise omitted (no
  placeholder or invented values).

## 8. Resolved questions

1. **Hobby icons: yes (owner decision).** Icons are allowed, but they must look
   better than generic emoji clutter: a consistent single-style icon set
   (lucide-react, already a dependency), one icon per hobby, sized and coloured
   with the chip state. No mixed emoji.
2. **Map tiles (my call, owner delegated):** leave unchanged in this project.
   A hosted style needs a provider account and API key, which is outside the
   front-end work. Recorded as a recommended follow-up (4.5).
3. **Dark mode warming and navy footer (my call, owner delegated):** go ahead
   as specified in 4.1 and 4.2.
4. **Phasing (my call, owner delegated):** Part A first, then Part B, because B
   screens inherit A's tokens and plate band.
5. **Backend items (my call, owner delegated):** out of scope for this project.
   Front-end ships first and shows those elements only where data already
   exists. A separate backend design follows later.

## 9. Left to the builder

- Exact spacing, type scale and colour tuning within the tokens above.
- Component structure for the shared plate band.
- Whether the sticky save bar or per-field autosave suits the profile API.
- Icon set for hobbies (lucide-react is already a dependency).
- Order of work within a part.

## 10. Verification

- Screenshot every changed page in light and dark at 1360px and mobile width
  using the audit script approach (Playwright against `localhost:5173` with the
  Docker API and seed data).
- Run lint, typecheck, format check and the e2e suite.
- Check reduced-motion behaviour and that skeletons cause no layout shift.
