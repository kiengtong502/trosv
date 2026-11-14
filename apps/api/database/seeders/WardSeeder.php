<?php

namespace Database\Seeders;

use App\Modules\Listing\Models\Listing;
use App\Modules\Reference\Models\City;
use App\Modules\Reference\Models\School;
use App\Modules\Reference\Models\Ward;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use RuntimeException;

class WardSeeder extends Seeder
{
    public function run(): void
    {
        /** @var array{units: list<array{name: string, latitude: string, longitude: string}>} $hcmData */
        $hcmData = File::json(database_path('data/hcm-wards-102.json'));
        $wards = $hcmData['units'];
        $oldToNew = [
            'Phường Bến Nghé' => 'Phường Sài Gòn',
            'Phường Linh Trung' => 'Phường Linh Xuân',
            'Phường Linh Chiểu' => 'Phường Thủ Đức',
            'Phường Võ Thị Sáu' => 'Phường Xuân Hòa',
            'Phường Tân Phong' => 'Phường Tân Hưng',
            'Phường Thảo Điền' => 'Phường An Khánh',
        ];

        DB::transaction(function () use ($wards, $oldToNew): void {
            $city = City::where('name', 'TP.HCM')->lockForUpdate()->first();
            if (! $city) {
                return;
            }

            foreach ($wards as $ward) {
                $previousNames = array_keys($oldToNew, $ward['name']);
                $previous = Ward::where('city_id', $city->id)->whereIn('name', $previousNames)->get();
                foreach (Listing::whereIn('ward_id', $previous->modelKeys())->get() as $listing) {
                    $listing->address = str_replace($previousNames, $ward['name'], $listing->address);
                    $listing->save();
                }
                $model = Ward::where('city_id', $city->id)->where('name', $ward['name'])->first()
                    ?? $previous->first()
                    ?? new Ward;
                $model->fill([
                    'city_id' => $city->id,
                    'name' => $ward['name'],
                    'latitude' => $ward['latitude'],
                    'longitude' => $ward['longitude'],
                ])->save();

                foreach ($previous as $oldWard) {
                    if ($oldWard->id === $model->id) {
                        continue;
                    }
                    // Move foreign keys before deleting a ward with cascading listings.
                    Listing::where('ward_id', $oldWard->id)->update(['ward_id' => $model->id]);
                    School::where('ward_id', $oldWard->id)->update(['ward_id' => $model->id]);
                    $oldWard->delete();
                }
            }

            $obsolete = Ward::where('city_id', $city->id)
                ->whereNotIn('name', array_column($wards, 'name'))->get();
            foreach ($obsolete as $ward) {
                // Split wards such as Đa Kao need an explicit choice if still referenced.
                if (Listing::where('ward_id', $ward->id)->exists() || School::where('ward_id', $ward->id)->exists()) {
                    throw new RuntimeException("Phường {$ward->name} còn dữ liệu cần xác định phường mới.");
                }
                $ward->delete();
            }
        });
    }
}
