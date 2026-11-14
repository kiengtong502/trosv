<?php

namespace App\Modules\Listing\Services;

use App\Modules\Listing\Models\Listing;
use App\Modules\Reference\Models\School;
use Illuminate\Database\Eloquent\Builder;

/**
 * Encapsulates search, filtering, geo-distance and sorting for listings.
 */
class ListingFilterService
{
    /**
     * Build the filtered and sorted Eloquent query for public listing search.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<Listing>
     */
    public function buildQuery(array $filters): Builder
    {
        $query = Listing::query()->inServiceArea()
            ->where('status', Listing::STATUS_AVAILABLE)
            ->with(['ward.city', 'coverImage'])
            ->withCount('reviews')
            ->withAvg('reviews', 'listing_rating');

        $this->applySearchTerm($query, $this->text($filters['q'] ?? null));
        $this->applyPriceRange($query, $filters['price_min'] ?? null, $filters['price_max'] ?? null);
        $this->applyLocation($query, $filters['ward_id'] ?? null, $filters['city_id'] ?? null);
        $this->applyRoomType($query, $this->text($filters['type'] ?? null));
        $this->applyAmenities($query, $this->ids($filters['amenity_ids'] ?? []));
        $this->applyDistance($query, $filters['school_id'] ?? null, $filters['max_km'] ?? null);
        $this->applySorting($query, $this->text($filters['sort'] ?? null) ?? 'newest');

        // Deterministic tiebreaker for stable pagination.
        $query->orderBy('id', 'desc');

        return $query;
    }

    private function text(mixed $value): ?string
    {
        return is_string($value) ? $value : null;
    }

    /** @return array<int, int|string> */
    private function ids(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter($value, fn ($id) => is_int($id) || is_string($id)));
    }

    /** @param  Builder<Listing>  $query */
    protected function applySearchTerm(Builder $query, ?string $q): void
    {
        if (! empty($q)) {
            // ILIKE: PostgreSQL case-insensitive search (ERD §4).
            $query->where(function (Builder $sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('address', 'ilike', "%{$q}%");
            });
        }
    }

    /** @param  Builder<Listing>  $query */
    protected function applyPriceRange(Builder $query, mixed $min, mixed $max): void
    {
        if ($min !== null) {
            $query->where('price', '>=', $min);
        }

        if ($max !== null) {
            $query->where('price', '<=', $max);
        }
    }

    /** @param  Builder<Listing>  $query */
    protected function applyLocation(Builder $query, mixed $wardId, mixed $cityId): void
    {
        if (! empty($wardId)) {
            $query->where('ward_id', $wardId);
        }

        // City filter: listing's ward belongs to the selected provincial unit.
        if (! empty($cityId)) {
            $query->whereHas('ward', fn (Builder $q) => $q->where('city_id', $cityId));
        }
    }

    /** @param  Builder<Listing>  $query */
    protected function applyRoomType(Builder $query, ?string $type): void
    {
        if (! empty($type)) {
            $query->where('type', $type);
        }
    }

    /**
     * @param  Builder<Listing>  $query
     * @param  array<int, int|string>  $amenityIds
     */
    protected function applyAmenities(Builder $query, array $amenityIds): void
    {
        // Listing must have ALL requested amenities.
        foreach ($amenityIds as $amenityId) {
            $query->whereHas('amenities', fn (Builder $q) => $q->where('amenities.id', $amenityId));
        }
    }

    /** @param  Builder<Listing>  $query */
    protected function applyDistance(Builder $query, mixed $schoolId, mixed $maxKm): void
    {
        // Distance calculation only when school_id is provided.
        if (! empty($schoolId)) {
            $school = is_int($schoolId) || is_string($schoolId) ? School::query()->find($schoolId) : null;

            if ($school !== null) {
                $max = is_numeric($maxKm) ? (float) $maxKm : null;
                $query->nearby((float) $school->latitude, (float) $school->longitude, $max);
            }
        }
    }

    /** @param  Builder<Listing>  $query */
    protected function applySorting(Builder $query, string $sort): void
    {
        match ($sort) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'distance' => $query->orderBy('distance_km'),
            // Single subquery with NULLS LAST in PostgreSQL replaces redundant double subquery scan.
            'rating' => $query->orderByRaw(
                '(SELECT AVG(listing_rating) FROM reviews WHERE reviews.listing_id = listings.id) DESC NULLS LAST'
            ),
            default => $query->orderBy('id', 'desc'), // newest
        };
    }
}
