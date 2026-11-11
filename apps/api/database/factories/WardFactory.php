<?php

namespace Database\Factories;

use App\Modules\Reference\Models\City;
use App\Modules\Reference\Models\Ward;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ward>
 */
class WardFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Phường '.fake()->unique()->city(),
            'city_id' => City::factory(),
            'latitude' => fake()->latitude(8.20, 23.40),
            'longitude' => fake()->longitude(102.10, 109.50),
        ];
    }
}
