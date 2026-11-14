<?php

namespace App\Shared\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ServiceArea
{
    public static function cityIds(): Builder
    {
        return DB::table('cities')->where('name', 'TP.HCM')->select('id');
    }

    public static function wardIds(): Builder
    {
        /** @var array{units: list<array{name: string}>} $data */
        $data = File::json(database_path('data/hcm-wards-102.json'));

        return DB::table('wards')->whereIn('city_id', self::cityIds())
            ->whereIn('name', array_column($data['units'], 'name'))->select('id');
    }

    public static function schoolIds(): Builder
    {
        // The two Đông Hòa campuses remain distance references despite having no local ward.
        return DB::table('schools')->whereIn('city_id', self::cityIds())->select('id');
    }
}
