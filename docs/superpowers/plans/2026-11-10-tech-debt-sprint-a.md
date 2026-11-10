# Tech Debt Sprint A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 71 PHPStan baseline errors in `apps/api`, extract `GeoQuery`, thin `ConversationController`, and modularize `apps/ai-service/app/gemini.py` into a clean package.

**Architecture:** Create `App\Support\GeoQuery` for single-sourced Haversine distance SQL; delegate conversation query logic from `ConversationController` to `ConversationService`; apply strict types across `AiClient`, AI services, seeders, and controllers to clear `phpstan-baseline.neon`; break `gemini.py` into modular domain handlers under `app/gemini/`.

**Tech Stack:** PHP 8.3, Laravel 12, PHPStan / Larastan (level max), Laravel Pint, Python 3.12, Google GenAI SDK, Pydantic, Docker.

**Spec:** [docs/superpowers/specs/2026-11-10-tech-debt-sprint-a-design.md](file:///home/user/Projects/trosv/docs/superpowers/specs/2026-11-10-tech-debt-sprint-a-design.md)

## Global Constraints

- Commit convention: Conventional commits in Vietnamese without diacritics (e.g. `refactor(api): ...`, `refactor(ai): ...`).
- Strict backward compatibility with `API_CONTRACT.md` and `AI_CONTRACT.md`.
- PHPStan level max must pass with 0 errors and an empty baseline.
- All files in `app/gemini/` must stay under 120 lines and cyclomatic complexity under 10.
- No frontend changes in this sprint.

## Review Focus

- Broken SQL syntax in `GeoQuery`: verify Haversine formula against known coordinates in unit tests.
- Missing authorization in refactored `ConversationController`: verify 404 for outsiders and 403 for self-messaging.
- Regression in AI client fallback: verify `generate_with_fallback` still switches to backup model candidates on error.
- Unhandled null or collection types in AI services: verify type assertions (`assert($listing instanceof Listing)`) and null-safety.
- Router import breakage in AI service: verify all 5 routers import seamlessly from `app.gemini`.

---

### Task 1: Extract `GeoQuery` & Encapsulate Distance Calculation

**Files:**
- Create: `apps/api/app/Support/GeoQuery.php`
- Create: `apps/api/tests/Unit/GeoQueryTest.php`
- Modify: `apps/api/app/Models/Listing.php`
- Modify: `apps/api/app/Services/ListingFilterService.php`
- Modify: `apps/api/tests/Unit/GeoTest.php`

**Interfaces:**
- Consumes: `App\Support\Geo::EARTH_RADIUS_KM`
- Produces: 
  - `GeoQuery::distanceSql(string $latColumn = 'latitude', string $lngColumn = 'longitude'): string`
  - `GeoQuery::distanceBinding(float $lat, float $lng, ?float $maxKm = null): array`
  - `GeoQuery::addDistanceSelect(Builder $query, float $lat, float $lng, ?float $maxKm = null): void`

- [ ] **Step 1: Write the failing unit test for `GeoQuery`**

Create `apps/api/tests/Unit/GeoQueryTest.php`:
```php
<?php

namespace Tests\Unit;

use App\Support\Geo;
use App\Support\GeoQuery;
use Tests\TestCase;

class GeoQueryTest extends TestCase
{
    public function test_distance_sql_contains_earth_radius_and_haversine(): void
    {
        $sql = GeoQuery::distanceSql('latitude', 'longitude');
        $this->assertStringStartsWith((string) Geo::EARTH_RADIUS_KM.' * ACOS(', $sql);
        $this->assertStringContainsString('COS(RADIANS(?))', $sql);
        $this->assertStringContainsString('COS(RADIANS(latitude))', $sql);
    }

    public function test_bindings_order(): void
    {
        $bindings = GeoQuery::distanceBindings(10.7769, 106.7009, 5.0);
        $this->assertSame([10.7769, 10.7769, 106.7009, 5.0], $bindings);
    }
}
```

- [ ] **Step 2: Implement `App\Support\GeoQuery`**

Create `apps/api/app/Support/GeoQuery.php`:
```php
<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Expression;
use Illuminate\Support\Facades\DB;

class GeoQuery
{
    public static function distanceSql(string $latCol = 'latitude', string $lngCol = 'longitude'): string
    {
        return sprintf(
            '%d * ACOS(LEAST(1.0, GREATEST(-1.0, COS(RADIANS(?)) * COS(RADIANS(%s)) * COS(RADIANS(%s) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(%s)))))',
            Geo::EARTH_RADIUS_KM,
            $latCol,
            $lngCol,
            $latCol
        );
    }

    /**
     * @return list<float>
     */
    public static function distanceBindings(float $lat, float $lng, ?float $maxKm = null): array
    {
        $bindings = [$lat, $lat, $lng];
        if ($maxKm !== null) {
            $bindings[] = $maxKm;
        }
        return $bindings;
    }

    /**
     * @param Builder<covariant \Illuminate\Database\Eloquent\Model> $query
     */
    public static function applyDistance(Builder $query, float $lat, float $lng, ?float $maxKm = null): void
    {
        $sql = self::distanceSql();
        $query->addSelect(DB::raw($sql.' AS distance_km'));
        $query->addBinding([$lat, $lat, $lng], 'select');

        if ($maxKm !== null) {
            $query->whereRaw($sql.' <= ?', [$lat, $lat, $lng, $maxKm]);
        }
    }
}
```

- [ ] **Step 3: Refactor `Listing.php` and `ListingFilterService.php` to use `GeoQuery`**

Replace `Listing::DISTANCE_SQL` references with `GeoQuery::distanceSql()`. Update `Listing::scopeWithDistance` and `ListingFilterService::orderByRaw` to invoke `GeoQuery`.

- [ ] **Step 4: Verify tests pass**

Verify `GeoQueryTest` and existing `GeoTest` pass.

- [ ] **Step 5: Commit changes**

```bash
git add apps/api/app/Support/GeoQuery.php apps/api/app/Models/Listing.php apps/api/app/Services/ListingFilterService.php apps/api/tests/Unit/GeoQueryTest.php apps/api/tests/Unit/GeoTest.php
git commit -m "refactor(api): trich xuat geoquery dong goi tinh toan toa do haversine"
```

---

### Task 2: Thin `ConversationController` & Enhance `ConversationService`

**Files:**
- Modify: `apps/api/app/Services/ConversationService.php`
- Modify: `apps/api/app/Http/Controllers/ConversationController.php`
- Test: `apps/api/tests/Feature/ConversationTest.php`

**Interfaces:**
- Consumes: `ConversationStoreRequest`, `MessageSendRequest`, `DirectMessageRequest`, `MessageListRequest`
- Produces:
  - `ConversationService::getUserConversations(User $user): Collection<int, Conversation>`
  - `ConversationService::getUnreadTotal(User $user): int`
  - `ConversationService::findOrCreateDirectConversation(int $studentId, int $targetUserId): array{Conversation, bool}`

- [ ] **Step 1: Check existing `ConversationTest`**

Verify feature tests in `apps/api/tests/Feature/ConversationTest.php` pass.

- [ ] **Step 2: Add query methods to `ConversationService`**

Move the index query with unread count subquery and student/landlord relationships into `ConversationService::getUserConversations(User $user)`. Move direct conversation instantiation into `ConversationService::findOrCreateDirectConversation()`.

- [ ] **Step 3: Thin `ConversationController`**

Update `index()`, `store()`, `direct()`, and `unreadCount()` in `ConversationController.php` to delegate directly to `ConversationService`. Ensure all controller methods are concise (< 30 lines) with proper type hinting.

- [ ] **Step 4: Verify tests pass**

Run `ConversationTest` and `BroadcastChannelTest` to confirm zero functional regression.

- [ ] **Step 5: Commit changes**

```bash
git add apps/api/app/Services/ConversationService.php apps/api/app/Http/Controllers/ConversationController.php
git commit -m "refactor(api): tinh gon conversationcontroller chuyen logic sang service"
```

---

### Task 3: Eliminate PHPStan Baseline in `apps/api` (71 -> 0)

**Files:**
- Modify: `apps/api/app/Services/AiClient.php`
- Modify: `apps/api/app/Services/Ai/AreaRecommender.php`
- Modify: `apps/api/app/Services/Ai/ChatAssistant.php`
- Modify: `apps/api/app/Services/Ai/RoommateMatcher.php`
- Modify: `apps/api/app/Services/Ai/PriceAdvisor.php`
- Modify: `apps/api/app/Services/Ai/DescriptionGenerator.php`
- Modify: `apps/api/app/Http/Controllers/MessageDeletionController.php`
- Modify: `apps/api/app/Http/Controllers/MessageReactionController.php`
- Modify: `apps/api/database/seeders/ListingSeeder.php`
- Modify: `apps/api/database/seeders/ConversationSeeder.php`
- Modify: `apps/api/phpstan-baseline.neon`

**Interfaces:**
- Consumes: PHPStan static analysis tool
- Produces: 0 errors with empty baseline

- [ ] **Step 1: Type `AiClient` and AI Services**

- In `AiClient.php`: Add `@return array<string, mixed>` to `post()`.
- In `ChatAssistant.php`: Add `assert($listing instanceof Listing);` after `find()`, and type closure parameter `/** @param array{role: string, content: string} $msg */`.
- In `AreaRecommender.php`: Ensure `$school instanceof School` check, and cast `$area['ward_id']` to `(int)` and `$area['reason']` to `(string)`.
- In `RoommateMatcher.php`: Strongly type candidate payloads and array offsets.
- In `PriceAdvisor.php`: Ensure `median(list<int|float> $values)` receives strictly typed numeric lists.
- In `DescriptionGenerator.php`: Handle nullable `$ward` safely.

- [ ] **Step 2: Type Controllers, Seeders, and Misc**

- In `MessageDeletionController.php`: Cast `$message->deleted_for_user_ids` to `(array)` and type array operations.
- In `ListingSeeder.php` & `ConversationSeeder.php`: Add `@var` docblocks on collection loops and relation models.
- In `bootstrap/app.php`: Handle exception type annotations.

- [ ] **Step 3: Clear `phpstan-baseline.neon` and verify 0 errors**

Empty `apps/api/phpstan-baseline.neon` (to `parameters: ignoreErrors: []`).
Run: `phpstan analyse --no-progress --memory-limit=1G`
Expected: [OK] No errors.

- [ ] **Step 4: Run Pint to ensure code style compliance**

Run: `pint --test`
Expected: 0 format issues.

- [ ] **Step 5: Commit changes**

```bash
git add apps/api/app/ apps/api/database/ apps/api/bootstrap/ apps/api/phpstan-baseline.neon
git commit -m "refactor(api): xoa bo hoan toan phpstan baseline voi 0 loi type"
```

---

### Task 4: Modularize `apps/ai-service/app/gemini.py`

**Files:**
- Create: `apps/ai-service/app/gemini/__init__.py`
- Create: `apps/ai-service/app/gemini/client.py`
- Create: `apps/ai-service/app/gemini/description.py`
- Create: `apps/ai-service/app/gemini/price_advice.py`
- Create: `apps/ai-service/app/gemini/roommates.py`
- Create: `apps/ai-service/app/gemini/areas.py`
- Create: `apps/ai-service/app/gemini/chat.py`
- Delete: `apps/ai-service/app/gemini.py`
- Test: `apps/ai-service/tests/test_contract.py`

**Interfaces:**
- Consumes: Google GenAI SDK, `apps/ai-service/knowledge.md`
- Produces: Exported functions in `app.gemini`:
  - `generate_description_with_gemini(data: dict[str, Any]) -> dict[str, str] | None`
  - `generate_price_advice_with_gemini(...) -> dict[str, Any] | None`
  - `rank_roommates_with_gemini(...) -> list[dict[str, Any]] | None`
  - `recommend_areas_with_gemini(...) -> list[dict[str, Any]] | None`
  - `chat_with_gemini(...) -> str | None`

- [ ] **Step 1: Create `app/gemini/client.py`**

Extract `get_api_key()`, `is_gemini_enabled()`, `_get_client()`, and `generate_with_fallback()` into `app/gemini/client.py`.

- [ ] **Step 2: Create domain endpoint modules**

- `description.py`: Description generation schema + prompt logic.
- `price_advice.py`: Price advice schema + prompt logic.
- `roommates.py`: Roommate ranking schema + prompt logic.
- `areas.py`: Area recommendation schema + prompt logic.
- `chat.py`: Knowledge base loading + chat generation prompt logic.

- [ ] **Step 3: Create `app/gemini/__init__.py` and delete monolithic `gemini.py`**

Re-export the 5 public generation functions and helper functions in `__init__.py`. Remove `gemini.py`.

- [ ] **Step 4: Verify contract tests and file line limits**

Run `pytest apps/ai-service/tests/test_contract.py`.
Verify all files in `apps/ai-service/app/gemini/` are under 120 lines.

- [ ] **Step 5: Commit changes**

```bash
git add apps/ai-service/app/gemini/ apps/ai-service/app/gemini.py
git commit -m "refactor(ai): module hoa gemini thanh package theo domain"
```

---

### Task 5: Full Suite Integration & CI Validation

**Files:**
- Modify: `docs/superpowers/plans/2026-11-10-tech-debt-sprint-a.md` (mark tasks complete)

**Interfaces:**
- Consumes: Complete project repository
- Produces: Clean git status and all CI checks green

- [ ] **Step 1: Run Backend Code Style & Static Analysis**

Verify Pint and PHPStan pass with 0 errors.

- [ ] **Step 2: Run Backend and AI Tests**

Verify Laravel feature tests and AI contract tests pass.

- [ ] **Step 3: Commit plan completion**

```bash
git commit -am "docs(debt): hoan thanh implementation plan sprint a"
```
