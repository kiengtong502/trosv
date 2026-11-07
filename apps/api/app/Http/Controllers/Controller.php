<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\AuthorizesResources;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class Controller
{
    use AuthorizesRequests;
    use AuthorizesResources;

    /** Maximum page size for every paginated endpoint (step 4 convention). */
    protected const PER_PAGE_MAX = 50;

    /** The authenticated user. Only for routes behind `auth:sanctum`; anything else is a 401. */
    protected function authUser(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        return $user;
    }

    /**
     * Validate `per_page` (1..50) with a contract-shaped 422, so pagination
     * behaves identically on /listings, /my/listings, /listings/{id}/reviews
     * and /favorites. Non-numeric or out-of-range values are rejected instead
     * of clamped (per_page=abc used to become 0 → paginate(0) → division by zero).
     */
    protected function perPage(Request $request): int
    {
        if ($request->query('per_page') === null) {
            return 12;
        }

        $validated = $request->validate([
            'per_page' => ['bail', 'integer', 'min:1', 'max:'.self::PER_PAGE_MAX],
        ], [
            'per_page.integer' => ':attribute phải là số nguyên.',
            'per_page.min' => ':attribute tối thiểu là 1.',
            'per_page.max' => ':attribute tối đa là '.self::PER_PAGE_MAX.'.',
        ], [
            'per_page' => 'Số tin mỗi trang',
        ]);

        $perPage = is_array($validated) ? ($validated['per_page'] ?? null) : null;

        return is_numeric($perPage) ? (int) $perPage : 12;
    }

    /**
     * Uniform paginated envelope { data, meta } around a JsonResource
     * collection. Keeps per_page as int in meta across all endpoints.
     *
     * @template TKey of array-key
     * @template TValue
     *
     * @param  LengthAwarePaginator<TKey, TValue>  $page
     * @param  class-string<JsonResource>  $resourceClass
     */
    protected function paginated(LengthAwarePaginator $page, string $resourceClass, Request $request): JsonResponse
    {
        return response()->json([
            'data' => $resourceClass::collection($page->getCollection())->resolve($request),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => (int) $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }
}
