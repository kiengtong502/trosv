<?php

namespace App\Modules\Listing\Http\Resources;

use App\Modules\Listing\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Review object per API_CONTRACT §3: student {id, name}, both ratings,
 * comment and created_at.
 *
 * @mixin Review
 */
class ReviewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student' => $this->student ? [
                'id' => $this->student->id,
                'name' => $this->student->name,
                'avatar' => $this->student->avatarKey(),
            ] : null,
            'listing_rating' => $this->listing_rating,
            'landlord_rating' => $this->landlord_rating,
            'comment' => $this->comment,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
