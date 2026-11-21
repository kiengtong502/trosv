<?php

namespace Tests\Feature\Seeders;

use App\Modules\Listing\Models\Listing;
use Database\Seeders\AmenitySeeder;
use Database\Seeders\CitySeeder;
use Database\Seeders\ListingSeeder;
use Database\Seeders\SchoolSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\WardSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ListingSeederPhotosTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_seeded_listing_gets_a_real_photo_of_its_type(): void
    {
        Storage::fake('public');
        $this->seed([CitySeeder::class, WardSeeder::class, SchoolSeeder::class, AmenitySeeder::class, UserSeeder::class, ListingSeeder::class]);

        $listings = Listing::with('images')->get();
        $this->assertNotEmpty($listings);
        foreach ($listings as $listing) {
            $this->assertCount(1, $listing->images);
            $bytes = Storage::disk('public')->get((string) $listing->images->first()?->path);
            $sources = array_map('file_get_contents', glob(database_path("seeders/images/{$listing->type}-*.jpg")) ?: []);
            $this->assertContains($bytes, $sources, "listing {$listing->id} ({$listing->type}) has no matching photo");
        }
    }
}
