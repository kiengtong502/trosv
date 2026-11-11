<?php

namespace Database\Factories;

use App\Modules\Auth\Models\User;
use App\Modules\Listing\Models\Listing;
use App\Modules\Listing\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'listing_id' => Listing::factory(),
            'student_id' => User::factory()->student(),
            'listing_rating' => fake()->numberBetween(1, 5),
            'landlord_rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->optional()->sentence(),
        ];
    }
}
