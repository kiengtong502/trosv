<?php

namespace Tests\Unit\Seeders;

use Database\Seeders\Support\SeedPrice;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SeedPriceTest extends TestCase
{
    /** @return array<string, array{int, int, int, int}> min price, max price, min area, max area */
    public static function templates(): array
    {
        return [
            'phong tro' => [2_500_000, 4_000_000, 18, 28],
            'phong re' => [1_800_000, 2_600_000, 15, 22],
            'studio' => [4_500_000, 6_500_000, 30, 42],
            'nha nguyen can' => [7_000_000, 12_000_000, 70, 110],
        ];
    }

    #[DataProvider('templates')]
    public function test_every_price_is_a_clean_multiple_of_ten_thousand_that_does_not_look_marketed(int $min, int $max, int $minArea, int $maxArea): void
    {
        for ($index = 1; $index <= 60; $index++) {
            for ($area = $minArea; $area <= $maxArea; $area++) {
                $price = SeedPrice::forArea($area, $min, $max, $minArea, $maxArea, $index);

                $this->assertSame(0, $price % 10_000, "area {$area}, listing {$index}: {$price}");
                $this->assertFalse(SeedPrice::looksOff($price), "area {$area}, listing {$index}: {$price}");
                $this->assertGreaterThanOrEqual($min - 30_000, $price);
                $this->assertLessThanOrEqual($max + 30_000, $price);
            }
        }
    }

    public function test_the_rejected_shapes_are_flagged(): void
    {
        foreach ([2_000_000, 2_600_000, 1_800_000, 2_900_000, 1_990_000, 2_999_000, 1_599_000, 2_878_400] as $price) {
            $this->assertTrue(SeedPrice::looksOff($price), (string) $price);
        }
        foreach ([1_940_000, 2_870_000, 3_260_000, 4_510_000] as $price) {
            $this->assertFalse(SeedPrice::looksOff($price), (string) $price);
        }
    }

    public function test_a_bigger_room_costs_more_for_the_same_listing(): void
    {
        $small = SeedPrice::forArea(18, 2_500_000, 4_000_000, 18, 28, 5);
        $large = SeedPrice::forArea(28, 2_500_000, 4_000_000, 18, 28, 5);

        $this->assertGreaterThan($small, $large);
    }

    public function test_the_same_listing_always_gets_the_same_price(): void
    {
        $this->assertSame(
            SeedPrice::forArea(22, 2_500_000, 4_000_000, 18, 28, 9),
            SeedPrice::forArea(22, 2_500_000, 4_000_000, 18, 28, 9),
        );
    }

    public function test_the_catalogue_is_not_all_one_ending(): void
    {
        $tens = [];
        for ($index = 1; $index <= 40; $index++) {
            $tens[intdiv(SeedPrice::forArea(22, 2_500_000, 4_000_000, 18, 28, $index), 10_000) % 10] = true;
        }

        $this->assertGreaterThanOrEqual(5, count($tens));
    }
}
