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
            'name' => fake()->randomElement(['Phường Tân Hưng', 'Phường Sài Gòn', 'Phường Chợ Quán', 'Phường Diên Hồng']),
            'city_id' => fn () => City::firstOrCreate(['name' => 'TP.HCM'], [
                'type' => City::TYPE_CITY, 'latitude' => 10.7769, 'longitude' => 106.7009,
            ])->id,
            'latitude' => fake()->latitude(8.20, 23.40),
            'longitude' => fake()->longitude(102.10, 109.50),
        ];
    }
}
