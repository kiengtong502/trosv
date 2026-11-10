# Design: Tech Debt Sprint A — Backend Typing, Architecture & AI Service Modularization

**Date:** 2026-11-10  
**Topic:** Tech Debt Reduction (Sprint A: Backend & AI Service)  
**Target Base:** `unstable`  

---

## 1. Intent and Why
Drive the backend static analysis debt to zero and eliminate monolithic backend and AI service files. Currently, 71 PHPStan errors are hidden behind a baseline, `ConversationController` mixes routing with business queries, raw SQL for distance is duplicated, and `gemini.py` (476 lines) bundles 5 different AI endpoints into a single file.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Eliminate all 71 PHPStan baseline errors** in `apps/api/phpstan-baseline.neon` so `phpstan analyse --level=max` passes with zero baseline dependencies.
- **Thin `ConversationController` (179 lines)** by moving query and business operations to `ConversationService`.
- **Encapsulate geospatial logic**: Extract raw `DISTANCE_SQL` from `Listing.php` into `App\Support\GeoQuery` with dedicated unit tests.
- **Modularize `apps/ai-service/app/gemini.py` (476 lines)** into a clean package (`app/gemini/`) with a shared client runner and isolated domain handlers (`chat`, `description`, `price_advice`, `roommates`, `areas`), keeping each file under 120 lines.
- **Zero breaking changes**: Full backward compatibility with `API_CONTRACT.md` and `AI_CONTRACT.md`. All backend feature tests (`php artisan test`) and AI contract tests (`pytest`) must pass.

### Non-Goals
- Modifying frontend code (`apps/web`) in this sprint (deferred to Sprint B).
- Modifying API endpoint routes, request validation contracts, or response schemas.
- Altering prompt logic or LLM outputs beyond code organization and typing.

### Anti-Goals
- Suppressing PHPStan errors with `@phpstan-ignore` or baseline regeneration instead of proper typing.
- Breaking database migrations or existing seeders.

---

## 3. Constraints
- Commit convention: Conventional commits in Vietnamese without diacritics (e.g. `refactor(api): ...`, `refactor(ai): ...`).
- PHP 8.3, Laravel 12 Pint formatting (`./vendor/bin/pint --test`).
- Python 3.12, strict type annotations, `pytest` passing for `apps/ai-service`.
- Full CI pass on `unstable` (`api`, `ai-service`, `secrets`, `infra`, `e2e`).

---

## 4. Approaches Considered

### Approach 1 (Selected): Domain-First Sequential Sprints (Sprint A)
- **What it does:** Solves backend typing (71 errors -> 0), extracts `GeoQuery`, thins `ConversationController`, and modularizes `gemini.py`. Leaves frontend changes for Sprint B.
- **Trade-off:** High leverage with zero risk of visual/UI regressions. Backend and AI engines become strictly typed and maintainable before touching frontend components.

### Approach 2: "Metrics to Zero" Across All Apps Simultaneously
- **What it does:** Mixes backend typing fixes with web illustration SVG extraction in one massive PR.
- **Trade-off:** High churn across disparate tech stacks (PHP + Python + TypeScript) in a single changeset, making review difficult.

### Approach 3: Frontend-First
- **What it does:** Defers all backend typing and AI service refactoring until frontend component ratchets are resolved.
- **Trade-off:** Leaves 71 PHPStan errors and untyped AI client contracts in the foundation while continuing to refactor UI.

---

## 5. Detailed Component Design

### 5.1. Backend Typing & Baseline Eradication (71 -> 0)
1. **`app/Services/AiClient.php` & AI Services:**
   - Add explicit return type `array<string, mixed>` to `AiClient::post()`.
   - In `ChatAssistant.php`: Add `assert($listing instanceof Listing)` and type `array_map` closure arguments explicitly.
   - In `AreaRecommender.php`: Type array casts for `ward_id`, `reason`, `distance_km`, and validate `$school instanceof School`.
   - In `RoommateMatcher.php`: Provide precise array shapes for candidate payloads and AI match results.
   - In `PriceAdvisor.php`: Ensure `median(list<int|float> $values)` receives strictly typed numeric lists.
2. **Controllers & Requests:**
   - In `ConversationController.php` & `MessageDeletionController.php`: Type input array parameters and cast IDs cleanly.
3. **Database Seeders:**
   - In `ListingSeeder.php` & `ConversationSeeder.php`: Add docblock generic types for collection iterations and model attributes.
4. **Baseline File:**
   - Clear or remove `apps/api/phpstan-baseline.neon` and verify `phpstan analyse` passes with 0 errors.

### 5.2. Architecture: `GeoQuery` & `ConversationController` Thinning
1. **`App\Support\GeoQuery`:**
   - Create `app/Support/GeoQuery.php` containing:
     - `haversineSql(string $latColumn, string $lngColumn): string`
     - `distanceKmSubquery(float $lat, float $lng, string $latCol = 'latitude', string $lngCol = 'longitude'): Expression`
   - Update `Listing.php` and `ListingFilterService.php` to consume `GeoQuery`.
   - Add unit test `tests/Unit/GeoQueryTest.php`.
2. **`ConversationController` Thinning:**
   - Move direct message creation, unread counts, and listing conversation lookups into `ConversationService`.
   - Keep controller methods under 30 lines each.

### 5.3. AI Service Modularization (`apps/ai-service`)
Transform `apps/ai-service/app/gemini.py` into a package:
```
apps/ai-service/app/gemini/
├── __init__.py          # Re-exports the 5 public generation functions for routers
├── client.py            # API key handling, genai.Client init, fallback runner
├── description.py       # generate_description_with_gemini + Pydantic schema
├── price_advice.py      # generate_price_advice_with_gemini + Pydantic schema
├── roommates.py         # rank_roommates_with_gemini + Pydantic schema
├── areas.py             # recommend_areas_with_gemini + Pydantic schema
└── chat.py              # chat_with_gemini + knowledge base reader + prompt
```
- Each module stays strictly under 100 lines and complexity under 10.
- Router imports (`from app.gemini import ...`) remain 100% backward-compatible.
- Verify contract with `pytest apps/ai-service/tests/test_contract.py`.

---

## 6. Verification Plan
- **Backend:**
  - `./vendor/bin/pint --test` (0 format issues)
  - `./vendor/bin/phpstan analyse --no-progress --memory-limit=1G` (0 errors, 0 baseline)
  - `php artisan test` (all test cases pass)
- **AI Service:**
  - `pytest apps/ai-service/tests/test_contract.py` (all contract tests pass)
  - `mypy apps/ai-service/app` (clean typecheck)
- **CI Safety:** Full suite run on `unstable`.
