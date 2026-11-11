<?php

namespace App\Modules\Listing\Http\Controllers;

use App\Modules\Listing\Http\Requests\ReviewStoreRequest;
use App\Modules\Listing\Http\Resources\ReviewResource;
use App\Modules\Listing\Models\Listing;
use App\Modules\Listing\Models\Review;
use App\Shared\Http\Controllers\Controller;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Reviews (API_CONTRACT §4 - "Đánh giá").
 */
class ReviewController extends Controller
{
    /**
     * GET /api/listings/{listing}/reviews - public, newest first, paginated.
     */
    public function index(Request $request, Listing $listing): JsonResponse
    {
        $page = $listing->reviews()
            ->with('student:id,name')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        $request->attributes->set('review_pagination', $page);

        return $this->paginated($page, ReviewResource::class, $request);
    }

    /**
     * POST /api/listings/{listing}/reviews - students only. Requires an existing
     * conversation about this listing; one review per student per listing.
     */
    public function store(ReviewStoreRequest $request, Listing $listing): JsonResponse
    {
        $user = $this->authUser($request);

        $data = $request->validated();

        // ERD §4: only students who already have a conversation may review.
        // 403 with the contract's specific message (API_CONTRACT §4).
        // ReviewPolicy::create supplies the decision; abort keeps the
        // contract message in the 403 body.
        abort_unless($user->can('review', $listing), 403, 'Bạn cần nhắn tin với chủ nhà trước khi đánh giá.');

        // One review per student per listing (unique constraint, ERD §3).
        // create-or-catch: a true double-submit race would otherwise crash
        // on the unique constraint (500); the loser still gets the same 422.
        try {
            $review = Review::create([
                'listing_id' => $listing->id,
                'student_id' => $user->id,
                ...$data,
            ]);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'listing_id' => ['Bạn đã đánh giá tin này rồi.'],
            ]);
        }

        return response()->json(['data' => (new ReviewResource($review->load('student')))->resolve($request)], 201);
    }
}
