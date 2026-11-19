<?php

namespace Database\Seeders\Support;

/**
 * Demo listing prices that read as worked out, not rounded or "marketing" prices.
 *
 * The rent follows the area (the template's price per m², nudged per listing) and is
 * a multiple of 10.000đ whose tens of thousands are never 0 or 9 (1.940.000đ, never
 * 2.000.000đ, 2.600.000đ, 2.900.000đ or 1.990.000đ). Every price ends in 0000, so
 * there are no just-under prices like 1.599.000đ or 2.999.000đ.
 */
final class SeedPrice
{
    private const STEP = 10_000;

    public static function forArea(int $area, int $minPrice, int $maxPrice, int $minArea, int $maxArea, int $index): int
    {
        $perM2 = ($minPrice + $maxPrice) / ($minArea + $maxArea);
        $nudge = 0.90 + (($index * 8) % 21) / 100; // 0.90 to 1.10 (8 and 21 share no factor, so all 21 steps are used), same listing, same price

        $price = (int) (round($area * $perM2 * $nudge / self::STEP) * self::STEP);
        $price = max($minPrice, min($maxPrice, $price));

        // The bounds are round numbers: step away from them (down from the top, up otherwise).
        $direction = $price >= $maxPrice ? -self::STEP : self::STEP;
        while (self::looksOff($price)) {
            $price += $direction;
        }

        return $price;
    }

    public static function looksOff(int $price): bool
    {
        // Multiples of 100.000 read as rounded (2.600.000, 2.900.000); x90 reads as just-under (1.990.000).
        return $price % self::STEP !== 0 || $price % 100_000 === 0 || intdiv($price, 1000) % 100 === 90;
    }
}
