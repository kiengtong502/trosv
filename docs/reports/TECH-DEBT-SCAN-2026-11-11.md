# Tech debt scan (2026-11-11)

Scope: `apps/web`, `apps/api`, `apps/ai-service`, Docker, CI, repo hygiene.
Baseline: `unstable` at `4b027e9` (after the feature/domain restructure of all three apps).
Method: tools run for real, not estimated. knip, jscpd, madge, ESLint at stricter limits
(complexity 8, function length 60), PHPStan level max, radon, vulture, pytest-cov, pip-audit,
`npm audit`, `composer audit`, `npm/composer/pip outdated`, grep sweeps, config and Dockerfile
review. Continues `TECH-DEBT-AUDIT-2026-11.md` (2026-11-07); that file's phases 0 to 2 are done.

Severity = how much it endangers production or slows future work. Effort: S under 1 day,
M 1-3 days, L about a week.

## Summary

| Area | Verdict | Biggest problem |
|---|---|---|
| Production runtime | **High** | API is served by `php artisan serve` (PHP dev server) in the deploy compose |
| Security posture | **High** | Unauthenticated AI service published on host port 8001 |
| Containers | Medium | api and ai-service images run as root; no image-level HEALTHCHECK |
| AI service tests | Medium | Real Gemini path is 28-50% covered; all tests run in fake mode |
| Architecture (new) | Medium | `shared/` imports from features; `favorites` and `listings` import each other |
| Frontend size | Medium | 54 functions over 60 lines, 28 over complexity 8; 16 files in the lint ratchet |
| Tests | Medium | E2E not hermetic; four web features have no unit tests |
| Dependencies | Medium | React 18, Vite 6, TS 5.6, Laravel 12, PHPUnit 11, google-genai 2 are a major behind |
| Backend structure | Low-Medium | Queries still live in 6 controllers |
| Repo hygiene and docs | Low | 9 unmerged and 4 merged-but-kept remote branches; 4 overlapping reports |

Nothing found is an emergency for a dev-only app. The two High items matter the moment this
gets real users.

---

## Findings

### P1. Production serves the API with PHP's built-in dev server. High. Effort M.
`docker-compose.yml:96-110` runs `exec php artisan serve --host=0.0.0.0 --port=8000` (also the
image `CMD`, `apps/api/Dockerfile:41`) with `PHP_CLI_SERVER_WORKERS: 4`. `deploy.yml` ships this
same file with `--profile tls`. PHP documents the built-in server as not for production: no
process supervision, no request timeouts or graceful reload, weak concurrency, and one stuck
worker among four stalls a quarter of traffic.
Fix: a production image with PHP-FPM plus nginx/Caddy, or FrankenPHP/Octane; keep `artisan serve`
for local dev only. Add a load smoke test to CI so a regression shows.

### P2. The AI service is published on the host, unauthenticated. High. Effort S.
`docker-compose.yml:270-271` maps `8001:8001`. The service is only meant to be called by the
backend over the compose network (`AI_URL: http://ai-service:8001`). With `GEMINI_API_KEY` set
and `FAKE_MODE=false`, anyone who can reach the host can spend the Gemini quota through
`/chat`, `/description` and the rest; the API's per-user throttle does not apply. It is behind
the `ai` profile, which `infra/deploy/deploy.sh` mentions as optional.
Fix: delete the `ports:` block (or bind `127.0.0.1:8001`); the backend does not need it.

### P3. Containers run as root, no image-level HEALTHCHECK. Medium. Effort S.
`apps/api/Dockerfile` and `apps/ai-service/Dockerfile` have no `USER`. Only `apps/web` has a
`HEALTHCHECK`; compose adds healthchecks, so the image alone is unprotected when run elsewhere.
Fix: non-root user, `HEALTHCHECK` in each Dockerfile. `deploy.yml` also has no
`timeout-minutes` (every other workflow does).

### P4. The real Gemini path is barely tested. Medium. Effort M.
Coverage 67% overall, but `app/shared/gemini_client.py` 43%, `features/chat/gemini.py` 28%,
`areas/gemini.py` 34%, `description/gemini.py` 42%, `roommates/gemini.py` 43%,
`price_advice/gemini.py` 50%. All 15 tests run with `FAKE_MODE=true`, so production behaviour
(parse failures, timeouts, empty responses, fallback to heuristics) is untested. radon: two
functions at complexity 12-13 (`rank_roommates_with_gemini`, `recommend_areas_with_gemini`).
Fix: test the Gemini modules with a stubbed `get_client` (success, malformed JSON, exception,
fallback). Then extract the repeated request/parse/fallback plumbing into the shared client.

### P5. Layering problems introduced by the restructure. Medium. Effort S-M.
Measured on `apps/web/src`:
- `shared/layout/shell.tsx` imports `features/auth`, `features/messaging` (`useUnreadCount`)
  and `features/ai` (`AiChatWidget`); `shared/api/axiosClient.ts` imports
  `features/messaging/api/echo`. `shared/` should not depend on features.
- Feature cycle `favorites <-> listings`: `ListingCard` uses `favoritesApi`, and `favoritesApi`
  imports `Paged` from `listingApi`.
- `Paged<T>` is a generic API type living in `features/listings/api`; used across features.
- File-level: madge found 0 cycles, and no feature imports a feature that imports it back
  other than the pair above.
Fix: move `shell.tsx` to `app/` (it composes features), move `Paged` to `shared/types`, and
invert the echo dependency in `axiosClient` (it only needs the token). Add an ESLint
`no-restricted-imports` rule: `shared/**` cannot import `features/**`.

### P6. Oversized components and functions. Medium. Effort L.
At the repo's own limits (complexity 12, 120 lines) 16 files sit in the ratchet. At stricter
limits (complexity 8, 60 lines): 54 functions over length, 28 over complexity. Largest:
`LandlordDashboard` 235 lines, `ListingCard` 170 (complexity 14), `ProfileHabitsCard` 170,
`MessagesList` 168, `AiChatWidget` 158, `Thread` (`ConversationDetail`) 155 (complexity 19),
`Register` 154, `Header` in `shell.tsx` 153, `ListingMap` 149. `shell.tsx` is 502 lines and
`shared/ui/illustrations.tsx` 655 with repeated SVG fragments.
The lower tier is mostly render-heavy components, so complexity matters more than length.
Fix by priority: `ConversationDetail` Thread, `ListingCard`, `RoomContactCard`
(complexity 16), `threadLayout`, then the rest as they are touched.

### P7. Test gaps. Medium. Effort M.
- Web unit tests by feature (files with a `.test.` sibling): `auth` 0 of 6 source files,
  `favorites` 0 of 2, `home` 0 of 6, `ai` 1 of 9, `room` 1 of 17, `landlord` 1 of 12.
- No coverage tooling installed for web (`@vitest/coverage-v8`) or API (no `pcov`/Xdebug), so
  "tested" is unmeasured outside the AI service.
- E2E is not hermetic: 12 `waitForTimeout`, 8 `test.skip` guards.
- Big test files: `messages.spec.ts` 636 lines, `AiProxyTest` 607, `ConversationTest` 601.
Fix: add the coverage reporters and a CI floor; write unit tests for `auth`
(`useAuthForm`, `AuthContext`) first because everything depends on it.

### P8. Dependencies. Medium. Effort M-L.
Majors behind: React 18.3 (19.3), `@types/react` 18 (19), Vite 6.4 (8.3), `@vitejs/plugin-react`
4 (6), TypeScript 5.6 (7.0; 5.9 is within range), jsdom 29 (31), knip 5 (6), Laravel 12.70 (13.42),
PHPUnit 11 (12), `google-genai` 2.34 (3.1), mypy 1.18 (2.4), ruff 0.15 (0.17).
Patch/minor lag: axios 1.21.0 -> 1.21.1, Playwright, lucide, Sanctum 4.3 -> 4.4, Reverb 1.12 -> 1.13.
Audit: `composer audit` and `pip-audit` clean; `npm audit --omit=dev` clean; full `npm audit`
reports a dev-only chain (`minimatch` via `@typescript-eslint`), fixed by the pending 8.72.2 bump.
Toolchain note: Vitest 5 and jest-dom 7 require Node >= 22 (CI uses 22; the repo pins it in
`.nvmrc`); `apt` Node is 20.

### P9. Backend structure. Low-Medium. Effort M.
- Queries remain in controllers: `ReferenceController` 6, `FavoriteController` 6,
  `ReviewController` 4, `LandlordListingController` 4, `ListingController` 3,
  `MessageDeletionController` 2. Fine at this size, harder to test and reuse.
- Raw SQL is contained: distance in `GeoQuery`, one `orderByRaw` for rating.
- `ListingFilterService:63` search uses `ilike '%q%'`: a leading wildcard cannot use a btree
  index. Fine now; add a `pg_trgm` GIN index before the table grows.
- Migrations run on every `backend` container start. Safe for one replica; two replicas
  starting together can race.
- Largest PHP file is 224 lines (`ConversationService`); nothing is large.

### P10. Frontend typing and effects. Low-Medium. Effort M.
7 `as unknown as`, 51 other `as` casts (Echo channels, Leaflet internals), 29 files with
`useEffect` (many still fetch with the ad hoc `let live = true` pattern), 14 `localStorage`
uses (accepted in ADR 0001), 3 `eslint-disable` (2 `exhaustive-deps`, 1 jsx-a11y).
No `any`, no `@ts-ignore`, no TODO/FIXME, 2 `console.*`.

### P11. Repo hygiene and docs. Low. Effort S.
- Remote branches merged into `unstable`: `chore/debt-phase-0`, `chore/dependabot-noise-reduction`,
  `legacy/pre-restructure`, `refactor/debt-sprint-a-backend-ai`. `stable` is also merged; check
  what deploys from it before touching it.
- Unmerged: `be/fix-conversation-test-flaky`, `chore/debt-phase-2e`, 6 Dependabot branches.
- Two local branches from this refactor remain.
- `docs/reports` has 4 earlier overlapping files (`TECH-DEBT.md` is marked superseded; `PLAN.md`
  and `BACKEND-AUDIT-REPORT.md` predate the code; this scan is the fifth); `docs/superpowers` has 17 files with no index.
- `docs/ONBOARDING.md` says "210+ tests"; actual: API 230, web unit 366, AI 15.
- Language mix across code comments, docs and commits (English, Vietnamese with and without
  diacritics).

---

## Verified clean (no action)

knip: 0 unused exports/files/deps. jscpd: 3 clones, 0.12% of lines. madge: 0 import cycles.
PHPStan level max: 0 errors, baseline empty. Pint, ruff, mypy clean. No `$guarded = []`, no
`dd()`/`dump()`, no committed `.env` or key-like strings. Pivot tables (`favorites`,
`amenity_listing`) have composite primary keys. Sanctum token TTL is 30 days; CORS is limited
to the frontend origin. Every CI action is pinned by SHA and every workflow declares
`permissions`. Dependabot covers composer, npm, pip, docker and actions.

## Fixed since the 2026-11-07 audit

PHPStan baseline 382 -> 0. God components split (`RoomDetail`, `MessageBubble`, `Thread`,
`Profile`, `Search` and others). Vitest added: 366 unit tests. Silent `.catch(() => {})`: 16 -> 0.
Dead Vite `terser` config gone. Laravel example tests gone. Restructure into feature modules done
for all three apps.

## Not measured

PHP and web code coverage (no tool installed), runtime performance and real N+1 behaviour,
load capacity, accessibility (axe) results, and the e2e suite on this machine (CI covers it).

## Suggested order

1. P2 (delete one `ports:` line) and P3 (non-root, `HEALTHCHECK`): S, high value.
2. P5 (layering fixes plus the lint rule so it cannot regress): S-M.
3. P4 (Gemini tests): M, protects the real path.
4. P1 (production runtime): M, do before any real traffic.
5. P7 coverage tooling, then P6/P10 as files are touched; P8 majors one at a time, React and
   Vite last.

## Status (branch `chore/debt-quick-wins`)

- **P2 fixed.** `ai-service` port is bound to `127.0.0.1:8001` only.
- **P3 partly fixed.** `ai-service` image runs as a non-root user and has a `HEALTHCHECK`.
  The `api` image is deliberately unchanged: the same image runs `backend`, `reverb`, `queue`
  and `scheduler`, so an image-level `HEALTHCHECK` would mark the non-HTTP ones unhealthy, and
  non-root needs the `trosv-storage` volume ownership sorted out. Do it together with P1, when
  the production image is split from the dev image. `deploy.yml` still has no `timeout-minutes`.
  Neither Docker change could be built in the scan environment; CI `docker-build` covers the build.
- **P5 fixed.** `shared/` imports nothing from `features/` or `app/`; the `favorites` <->
  `listings` cycle is gone (feature graph is acyclic); `Paged<T>` lives in `shared/types`;
  `shell.tsx` moved to `app/`; `Footer` is in `shared/layout`. ESLint `no-restricted-imports`
  enforces `app > features > shared` (verified to fail on a deliberate violation).
- **P4 fixed (branch `chore/ai-gemini-tests`).** 107 new offline tests cover the shared Gemini
  client (key precedence, model fallback order, SDK errors), each feature's prompt building and
  response validation, and the router decision (Gemini answer vs heuristic fallback vs 503).
  `app/` coverage 67% -> 98%; a 14-mutant check (breaking id filtering, limits, verdict check,
  history window, model order, key precedence, guards) is fully caught. It also found a typo in
  the production chat system prompt ("Luêu trả lời" -> "Luôn trả lời"), now fixed. Not done from
  P4: extracting the duplicated request/parse/fallback plumbing; the tests now make that safe.
- **P1 fixed (branch `chore/api-production-runtime`).** The API image is now FrankenPHP (Caddy +
  PHP 8.3) with a production `php.ini`; `artisan serve` is gone from compose and the image.
  Config: `apps/api/docker/{Caddyfile,php.ini}`. Verified by building and running the full stack
  (isolated compose project): 25 live checks (auth, JSON errors, gzip, uploads, files served
  from `/storage`, signed attachment URLs and tampering, 413/422 limits, Reverb broadcast, 300
  requests at 32 concurrency with no failures), the PHP suite inside the image (231 tests), a
  from-scratch boot with no queue/scheduler errors, and graceful stop (about 0.5 s, exit 0).
  Not done: the native mode of `infra/deploy/deploy.sh` and the CI e2e job still use
  `artisan serve` (demo and test only); CI does not run the compose stack.
- **P3 completed.** The `api` image now runs as `www-data` too. Because an old root-owned
  `trosv-storage` volume made uploads fail *silently*, the backend now refuses to start when
  storage is not writable and prints the fix (also in `docs/runbooks/DEPLOY.md`).
- **Bugs found while verifying P1 (all pre-existing, now fixed):**
  nginx capped request bodies at its 1 MB default, so any larger photo or attachment got 413
  through the real stack (now 16 MB); an attachment over PHP's upload limit returned 500 instead
  of a 422 (regression test added); `queue`/`scheduler` raced the migrations on a fresh stack.
- **CI now runs the real stack (branch `chore/ci-stack-smoke`).** `_stack.yml` starts the compose
  stack and runs `scripts/stack-smoke.py` (26 checks, incl. a chat message delivered over a real
  WebSocket to Reverb) plus a clean-start check of queue/scheduler; it gates Deploy through
  `ci-ok`. Mutation-checked: re-introducing the nginx 1 MB limit, a dead backend-to-Reverb path
  or the migrate/worker race each fails it. It found one more bug: with Reverb down every chat
  action (send, read, react, unsend) returned 500, because `broadcast()` fires in a destructor
  outside `rescue()`; fixed with `event()` and six regression tests.
- **P7 partly fixed (branch `chore/coverage-auth-tests`).** Coverage is now measured and gated:
  web via `@vitest/coverage-v8` (15.4% -> 22.3% lines, floor 22%), API via `pcov` (97.1%, floor
  96%); both fail CI if coverage drops (verified). 45 new `auth` unit tests took it from 0%
  and found three real UI bugs, fixed: Login/Register client-side validation messages were wiped
  immediately by `onError`, and Login never returned to the page the user came from. Still open:
  `favorites`, `home`, `ai`, `room`, `landlord` have little or no unit coverage, and E2E is
  still not hermetic (`waitForTimeout`, `test.skip`).
- **P8 partly fixed (branch `chore/deps-safe-updates`).** Every in-range update applied: web
  (Playwright 1.65, axios 1.21.1, lucide 1.72, Prettier 3.10, TypeScript 5.9, typescript-eslint
  8.72.2, Vite 6.4.6) and API (Laravel 12.72, Sanctum 4.4, Reverb 1.13, Larastan 3.15, PHPUnit
  11.5.57 and 17 more). Only the majors remain: React 19, Vite 8, `@vitejs/plugin-react` 6,
  TypeScript 7, jsdom 31, knip 6, Laravel 13, PHPUnit 12, `google-genai` 3.
  Correction to the P8 text above: the 9 moderate `npm audit` findings are **not** cleared by the
  typescript-eslint bump. They are one `minimatch` DoS advisory (GHSA-g3hv-75wg-m249, versions
  below 11.0.1) reached through `typescript-estree` and ESLint, dev tooling only (`npm audit
  --omit=dev`: 0), and npm's suggested "fixes" are downgrades. Wait for upstream. Also note
  ESLint 10 is installed while `eslint-plugin-jsx-a11y` declares support up to ESLint 9.
- Open: P6, P8 majors, P9-P11, and the rest of P7.
