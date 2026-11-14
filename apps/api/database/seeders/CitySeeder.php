<?php

namespace Database\Seeders;

use App\Modules\Reference\Models\City;
use Illuminate\Database\Seeder;

class CitySeeder extends Seeder
{
    public function run(): void
    {
        City::create([
            'name' => 'TP.HCM',
            'type' => City::TYPE_CITY,
            'latitude' => 10.7769,
            'longitude' => 106.7009,
        ]);
    }
}
