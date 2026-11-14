<?php

namespace Database\Seeders;

use App\Modules\Reference\Models\City;
use App\Modules\Reference\Models\School;
use App\Modules\Reference\Models\Ward;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        /** @var array{schools: list<array{name: string, latitude: string, longitude: string, ward_name: string, previous_name?: string}>} $hcmData */
        $hcmData = File::json(database_path('data/hcm-schools-main-campuses.json'));
        $schools = $hcmData['schools'];

        DB::transaction(function () use ($schools): void {
            $city = City::where('name', 'TP.HCM')->lockForUpdate()->first();
            if (! $city) {
                return;
            }

            foreach ($schools as $school) {
                $ward = Ward::where('city_id', $city->id)
                    ->where('name', $school['ward_name'])
                    ->first();

                // Keep existing IDs so student profiles retain their school.
                $model = School::where('city_id', $city->id)
                    ->whereIn('name', [$school['name'], $school['previous_name'] ?? $school['name']])
                    ->first() ?? new School;

                $model->fill([
                    'city_id' => $city->id,
                    'ward_id' => $ward?->id,
                    'name' => $school['name'],
                    'latitude' => $school['latitude'],
                    'longitude' => $school['longitude'],
                ])->save();
            }
        });
    }
}
