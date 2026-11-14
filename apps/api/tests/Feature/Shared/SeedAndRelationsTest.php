<?php

namespace Tests\Feature\Shared;

use App\Modules\Auth\Models\User;
use App\Modules\Listing\Models\Listing;
use App\Modules\Listing\Models\Review;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\Reference\Models\City;
use App\Modules\Reference\Models\School;
use App\Modules\Reference\Models\Ward;
use Database\Seeders\CitySeeder;
use Database\Seeders\SchoolSeeder;
use Database\Seeders\WardSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SeedAndRelationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_command_runs_without_errors(): void
    {
        $this->artisan('db:seed', ['--force' => true])->assertExitCode(0);

        $this->assertDatabaseCount('cities', 1);
        $this->assertDatabaseCount('wards', 102);
        $this->assertDatabaseCount('schools', 61);
        $this->assertSame(['TP.HCM'], City::pluck('name')->all());
        $this->assertSame(16, Listing::inServiceArea()->count());
        $this->assertSame(10, User::where('role', User::ROLE_STUDENT)
            ->whereHas('school.city', fn ($query) => $query->where('name', 'TP.HCM'))->count());
        $this->assertDatabaseCount('users', 13);
        $this->assertDatabaseCount('listings', 16);
        // Sample image files need GD (bundled in the Docker image); without GD
        // the seeder still seeds everything except the picture files.
        $this->assertDatabaseCount('listing_images', extension_loaded('gd') ? 16 : 0);
        $this->assertDatabaseCount('conversations', 6);
        $this->assertDatabaseCount('reviews', 4);

        // Demo accounts exist with the shared password.
        $student = User::where('email', 'student1@example.com')->first();
        $landlord = User::where('email', 'landlord1@example.com')->first();
        $this->assertNotNull($student, 'student1@example.com must exist');
        $this->assertNotNull($landlord, 'landlord1@example.com must exist');
        $this->assertTrue(Hash::check('password', $student->password));
        $this->assertTrue(Hash::check('password', $landlord->password));

        // Seeded prices stay in the 1.5M..12M VND range (including student houses).
        $this->assertTrue(Listing::whereBetween('price', [1_500_000, 12_000_000])->count() === 16);
        $this->assertSame(0, Listing::where('title', 'like', '% - Gần ĐH Quốc tế (%')->count());
        $this->assertSame(0, Listing::where('title', 'like', '% - Gần ĐH Khoa học Sức khỏe (%')->count());
    }

    public function test_hcmc_schools_use_provided_coordinates_and_available_wards(): void
    {
        $this->seed([CitySeeder::class, WardSeeder::class, SchoolSeeder::class]);

        $hcmc = City::where('name', 'TP.HCM')->firstOrFail();
        $schools = School::where('city_id', $hcmc->id)->get()->keyBy('name');
        $data = json_decode(file_get_contents(database_path('data/hcm-schools-main-campuses.json')), true, 512, JSON_THROW_ON_ERROR);

        $this->assertCount(61, $schools);

        foreach ($data['schools'] as $row) {
            $school = $schools->get($row['name']);
            $this->assertNotNull($school);
            $this->assertSame(number_format((float) $row['latitude'], 7, '.', ''), $school->latitude);
            $this->assertSame(number_format((float) $row['longitude'], 7, '.', ''), $school->longitude);
            $ward = Ward::where('city_id', $hcmc->id)->where('name', $row['ward_name'])->first();
            $this->assertSame($ward?->id, $school->ward_id);
        }

        $this->assertNull($schools->get('ĐH Quốc tế')->ward_id);
        $this->assertNull($schools->get('ĐH Khoa học Sức khỏe')->ward_id);
        $response = $this->getJson('/api/schools?city_id='.$hcmc->id)->assertOk()->assertJsonCount(61, 'data');
        $publicSchools = collect($response->json('data'))->keyBy('name');
        foreach ($data['schools'] as $row) {
            $this->assertSame($row['campus_name'], $publicSchools[$row['name']]['campus_name']);
            $this->assertSame($row['address'], $publicSchools[$row['name']]['address']);
        }
    }

    public function test_reference_seeds_leave_existing_outside_city_data_unchanged(): void
    {
        $city = City::factory()->create(['name' => 'Hà Nội']);
        $ward = Ward::factory()->create(['city_id' => $city->id, 'name' => 'Phường cũ ngoài phạm vi']);
        $school = School::factory()->create(['city_id' => $city->id, 'ward_id' => $ward->id]);
        $listing = Listing::factory()->create(['ward_id' => $ward->id]);
        $student = User::factory()->create(['school_id' => $school->id]);
        $oldCity = $city->refresh()->getAttributes();
        $oldWard = $ward->refresh()->getAttributes();
        $oldSchool = $school->refresh()->getAttributes();

        $this->seed([CitySeeder::class, WardSeeder::class, SchoolSeeder::class]);

        $this->assertDatabaseCount('cities', 2);
        $this->assertDatabaseCount('wards', 103);
        $this->assertDatabaseCount('schools', 62);
        $this->assertSame($oldCity, $city->refresh()->getAttributes());
        $this->assertSame($oldWard, $ward->refresh()->getAttributes());
        $this->assertSame($oldSchool, $school->refresh()->getAttributes());
        $this->assertSame($ward->id, $listing->refresh()->ward_id);
        $this->assertSame($school->id, $student->refresh()->school_id);
    }

    public function test_school_sync_preserves_existing_profile_links_and_is_repeatable(): void
    {
        $this->seed([CitySeeder::class, WardSeeder::class]);
        $hcmc = City::where('name', 'TP.HCM')->firstOrFail();
        $existing = School::factory()->create([
            'city_id' => $hcmc->id,
            'name' => 'ĐH Tôn Đức Thắng (TDTU)',
        ]);
        $student = User::factory()->create(['school_id' => $existing->id]);

        $this->seed(SchoolSeeder::class);
        $ids = School::orderBy('id')->pluck('id', 'name')->all();
        $this->seed(SchoolSeeder::class);

        $this->assertSame($ids, School::orderBy('id')->pluck('id', 'name')->all());
        $this->assertSame('ĐH Tôn Đức Thắng', $existing->refresh()->name);
        $this->assertSame($existing->id, $student->refresh()->school_id);
        $this->assertSame(61, School::where('city_id', $hcmc->id)->count());
        $this->assertDatabaseCount('schools', 61);
    }

    public function test_ward_sync_preserves_listings_and_relinks_merged_wards(): void
    {
        $city = City::factory()->create(['name' => 'TP.HCM']);
        $old = Ward::factory()->create(['city_id' => $city->id, 'name' => 'Phường Tân Phong']);
        $target = Ward::factory()->create(['city_id' => $city->id, 'name' => 'Phường Tân Hưng']);
        $renamed = Ward::factory()->create(['city_id' => $city->id, 'name' => 'Phường Bến Nghé']);
        Ward::factory()->create(['city_id' => $city->id, 'name' => 'Phường Đa Kao']);
        $listing = Listing::factory()->create([
            'ward_id' => $old->id,
            'address' => 'Số 1 Đường A, Phường Tân Phong, TP.HCM',
        ]);
        $renamedListing = Listing::factory()->create([
            'ward_id' => $renamed->id,
            'address' => 'Số 2 Đường B, Phường Bến Nghé, TP.HCM',
        ]);
        $school = School::factory()->create(['city_id' => $city->id, 'ward_id' => $old->id]);

        $this->seed(WardSeeder::class);
        $ids = Ward::orderBy('id')->pluck('id', 'name')->all();
        $this->seed(WardSeeder::class);

        $this->assertSame($ids, Ward::orderBy('id')->pluck('id', 'name')->all());
        $this->assertDatabaseCount('wards', 102);
        $this->assertSame($target->id, $listing->refresh()->ward_id);
        $this->assertSame('Số 1 Đường A, Phường Tân Hưng, TP.HCM', $listing->address);
        $this->assertSame('Số 2 Đường B, Phường Sài Gòn, TP.HCM', $renamedListing->refresh()->address);
        $this->assertSame($target->id, $school->refresh()->ward_id);
        $this->assertSame('Phường Sài Gòn', $renamed->refresh()->name);
        $this->assertDatabaseMissing('wards', ['id' => $old->id]);
        $this->assertDatabaseMissing('wards', ['name' => 'Phường Đa Kao']);
        $this->getJson('/api/wards?city_id='.$city->id)->assertOk()->assertJsonCount(102, 'data');
    }

    public function test_ward_sync_rolls_back_when_a_split_ward_still_has_data(): void
    {
        $city = City::factory()->create(['name' => 'TP.HCM']);
        $ward = Ward::factory()->create(['city_id' => $city->id, 'name' => 'Phường Đa Kao']);
        $listing = Listing::factory()->create(['ward_id' => $ward->id]);

        try {
            $this->seed(WardSeeder::class);
            $this->fail('A referenced split ward requires an explicit destination.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('Đa Kao', $exception->getMessage());
        }

        $this->assertDatabaseCount('wards', 1);
        $this->assertSame($ward->id, $listing->refresh()->ward_id);
    }

    public function test_listing_ward_and_amenity_relations_work(): void
    {
        $this->seed();

        $listing = Listing::has('amenities')->first();

        $this->assertNotNull($listing->ward);
        $this->assertDatabaseHas('wards', ['id' => $listing->ward_id]);
        $this->assertGreaterThanOrEqual(4, $listing->amenities->count());
        $this->assertLessThanOrEqual(7, $listing->amenities->count());
        $this->assertSame($listing->user_id, $listing->landlord->id);
    }

    public function test_conversation_message_relation_works(): void
    {
        $this->seed();

        // Eager load so preventLazyLoading (step 10) does not flag $message->conversation.
        $conversation = Conversation::has('messages')->with('messages.conversation')->first();

        $this->assertGreaterThanOrEqual(1, $conversation->messages->count());
        $this->assertInstanceOf(Message::class, $conversation->messages->first());

        $message = $conversation->messages->first();
        $this->assertSame($conversation->id, $message->conversation->id);
        $this->assertContains($message->sender_id, [$conversation->student_id, $conversation->landlord_id]);
    }

    public function test_cover_image_is_image_with_smallest_id(): void
    {
        $this->seed();

        $listing = Listing::first();
        $listing->images()->delete();

        $listing->images()->createMany([
            ['path' => 'listings/test-b.jpg'],
            ['path' => 'listings/test-a.jpg'],
            ['path' => 'listings/test-c.jpg'],
        ]);

        // Cover = image with the smallest id, regardless of insertion order/path.
        $this->assertSame(
            $listing->images()->min('id'),
            $listing->coverImage->first()->id,
        );
    }

    public function test_reviews_are_backed_by_conversations(): void
    {
        $this->seed();

        // ERD rule: a student can only review a listing they have a conversation about.
        $orphanReviews = Review::whereNotExists(function ($query) {
            $query->selectRaw(1)
                ->from('conversations')
                ->whereColumn('conversations.student_id', 'reviews.student_id')
                ->whereColumn('conversations.listing_id', 'reviews.listing_id');
        })->count();

        $this->assertSame(0, $orphanReviews);
    }

    public function test_user_messages_and_reviews_relations_work(): void
    {
        $this->seed();

        $sender = User::whereHas('messages')->first();
        $this->assertNotNull($sender);
        $this->assertGreaterThanOrEqual(1, $sender->messages()->count());

        $reviewer = User::whereHas('reviews')->first();
        $this->assertNotNull($reviewer);
        $this->assertGreaterThanOrEqual(1, $reviewer->reviews()->count());
    }
}
