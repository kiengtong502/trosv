<?php

namespace App\Shared\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class GeoQuery
{
    /**
     * SQL expression computing Haversine distance in km using PostgreSQL float8 casts.
     * Placeholders (?, ?, ?) correspond to ($latitude, $longitude, $latitude).
     */
    public const DISTANCE_SQL =
        Geo::EARTH_RADIUS_KM.' * ACOS(LEAST(1, COS(RADIANS(CAST(? AS float8))) * COS(RADIANS(latitude)) * '
        .'COS(RADIANS(longitude) - RADIANS(CAST(? AS float8))) + '
        .'SIN(RADIANS(CAST(? AS float8))) * SIN(RADIANS(latitude))))';

    public static function distanceSql(string $latCol = 'latitude', string $lngCol = 'longitude'): string
    {
        if ($latCol === 'latitude' && $lngCol === 'longitude') {
            return self::DISTANCE_SQL;
        }

        return sprintf(
            '%d * ACOS(LEAST(1, COS(RADIANS(CAST(? AS float8))) * COS(RADIANS(%s)) * '
            .'COS(RADIANS(%s) - RADIANS(CAST(? AS float8))) + '
            .'SIN(RADIANS(CAST(? AS float8))) * SIN(RADIANS(%s))))',
            Geo::EARTH_RADIUS_KM,
            $latCol,
            $lngCol,
            $latCol
        );
    }

    /**
     * @return list<float>
     */
    public static function distanceBindings(float $latitude, float $longitude, ?float $maxKm = null): array
    {
        $bindings = [$latitude, $longitude, $latitude];
        if ($maxKm !== null) {
            $bindings[] = $maxKm;
        }

        return $bindings;
    }

    /**
     * Apply distance_km select and optional maxKm filter to query.
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public static function applyDistance(Builder $query, float $latitude, float $longitude, ?float $maxKm = null): Builder
    {
        $bindings = self::distanceBindings($latitude, $longitude);

        $query->addSelect(DB::raw(self::DISTANCE_SQL.' AS distance_km'));
        $query->addBinding($bindings, 'select');

        if ($maxKm !== null) {
            $query->whereRaw(self::DISTANCE_SQL.' <= ?', self::distanceBindings($latitude, $longitude, $maxKm));
        }

        return $query;
    }
}
