<?php

namespace Tests\Unit;

use App\Support\Geo;
use App\Support\GeoQuery;
use PHPUnit\Framework\TestCase;

class GeoQueryTest extends TestCase
{
    public function test_distance_sql_contains_earth_radius_and_haversine(): void
    {
        $sql = GeoQuery::distanceSql('latitude', 'longitude');
        $this->assertStringStartsWith((string) Geo::EARTH_RADIUS_KM.' * ACOS(', $sql);
        $this->assertStringContainsString('COS(RADIANS(CAST(? AS float8)))', $sql);
        $this->assertStringContainsString('COS(RADIANS(latitude))', $sql);
        $this->assertStringContainsString('COS(RADIANS(longitude) - RADIANS(CAST(? AS float8)))', $sql);
    }

    public function test_distance_bindings_order(): void
    {
        $bindings = GeoQuery::distanceBindings(10.7769, 106.7009);
        $this->assertSame([10.7769, 106.7009, 10.7769], $bindings);

        $withMax = GeoQuery::distanceBindings(10.7769, 106.7009, 5.0);
        $this->assertSame([10.7769, 106.7009, 10.7769, 5.0], $withMax);
    }

    public function test_custom_columns_in_distance_sql(): void
    {
        $sql = GeoQuery::distanceSql('lat', 'lng');
        $this->assertStringContainsString('COS(RADIANS(lat))', $sql);
        $this->assertStringContainsString('COS(RADIANS(lng) - RADIANS(CAST(? AS float8)))', $sql);
    }
}
