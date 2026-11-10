<?php

namespace App\Services\Ai;

use App\Models\School;
use App\Models\User;
use App\Models\Ward;
use App\Services\AiClient;
use App\Support\Geo;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class AreaRecommender
{
    public function __construct(private readonly AiClient $ai) {}

    /**
     * Area suggestions: budget/school fall back to the profile. Per-ward
     * stats computed in PHP; AI ranks and returns reasons; Backend
     * re-attaches names and stats.
     *
     * @param  array<string, mixed>  $data  validated request data
     * @return list<array<string, mixed>>
     */
    public function suggest(User $me, array $data): array
    {
        $budgetMin = $data['budget_min'] ?? $me->budget_min;
        $budgetMax = $data['budget_max'] ?? $me->budget_max;
        $schoolId = $data['school_id'] ?? $me->school_id;

        if ($budgetMin === null && $budgetMax === null) {
            throw ValidationException::withMessages([
                'budget_min' => ['Hãy cung cấp ngân sách hoặc hoàn thiện hồ sơ.'],
            ]);
        }

        $budgetMin = is_numeric($budgetMin) ? (int) $budgetMin : 0;
        $budgetMax = is_numeric($budgetMax) ? (int) $budgetMax : PHP_INT_MAX;

        /** @var School|null $school */
        $school = $schoolId !== null ? School::find($schoolId) : null;

        $wards = Ward::query()
            ->whereHas('listings', fn ($q) => $q->visible()
                ->whereBetween('price', [$budgetMin, $budgetMax]))
            ->with(['listings' => fn ($q) => $q->visible()
                ->whereBetween('price', [$budgetMin, $budgetMax])
                ->withAvg('reviews', 'listing_rating')])
            ->get();

        $areas = $wards->map(function (Ward $ward) use ($school) {
            $listings = $ward->listings;
            $prices = $listings->pluck('price')->map(fn (mixed $p): float => is_numeric($p) ? (float) $p : 0.0)->sort()->values();
            $ratings = $listings->pluck('reviews_avg_listing_rating')->filter()->map(fn (mixed $r): float => is_numeric($r) ? (float) $r : 0.0);

            return [
                'ward_id' => $ward->id,
                'name' => $ward->name,
                'listings_count' => $listings->count(),
                'avg_price' => $prices->isEmpty() ? null : (int) round((float) $prices->avg()),
                'avg_rating' => $ratings->isEmpty() ? null : round((float) $ratings->avg(), 1),
                'distance_to_school_km' => ($school !== null && $school->latitude !== null
                    && $school->longitude !== null && $ward->latitude !== null && $ward->longitude !== null)
                    ? Geo::haversineKm(
                        (float) $school->latitude,
                        (float) $school->longitude,
                        (float) $ward->latitude,
                        (float) $ward->longitude
                    )
                    : null,
            ];
        })->values()->all();

        if ($areas === []) {
            return [];
        }

        $response = $this->ai->post('/areas', [
            'preferences' => [
                'budget_min' => $budgetMin,
                'budget_max' => $budgetMax,
                'priorities' => $data['priorities'] ?? [],
            ],
            // Names go through: ward names are not personal data and the
            // AI contract includes them in the request (docs/contracts/AI_CONTRACT.md §4).
            'areas' => $areas,
            'limit' => 3,
        ], ['results']);

        // Re-attach name + stats for the wards the AI kept.
        /** @var Collection<int, array{ward_id: int, name: string, listings_count: int, avg_price: int|null, avg_rating: float|null, distance_to_school_km: float|null}> $byId */
        $byId = collect($areas)->keyBy('ward_id');
        $results = [];

        /** @var list<array{ward_id: int, reason?: string}> $aiRows */
        $aiRows = is_array($response['results'] ?? null) ? $response['results'] : [];
        foreach ($aiRows as $row) {
            $targetWardId = (int) ($row['ward_id'] ?? 0);
            $area = $byId->get($targetWardId);
            if ($area === null || count($results) >= 3) {
                continue;
            }

            $results[] = [
                'ward_id' => $area['ward_id'],
                'name' => $area['name'],
                'reason' => is_string($row['reason'] ?? null) ? $row['reason'] : '',
                'stats' => [
                    'listings_count' => $area['listings_count'],
                    'avg_price' => $area['avg_price'],
                    'avg_rating' => $area['avg_rating'],
                    'distance_to_school_km' => $area['distance_to_school_km'],
                ],
            ];
        }

        return $results;
    }
}
