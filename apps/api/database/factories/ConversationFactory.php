<?php

namespace Database\Factories;

use App\Modules\Auth\Models\User;
use App\Modules\Listing\Models\Listing;
use App\Modules\Messaging\Models\Conversation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Conversation>
 */
class ConversationFactory extends Factory
{
    public function definition(): array
    {
        $listing = Listing::factory()->create();

        return [
            'listing_id' => $listing->id,
            'student_id' => User::factory()->student(),
            // landlord_id mirrors listings.user_id (ERD §3).
            'landlord_id' => $listing->user_id,
        ];
    }
}
