<?php

namespace Tests\Feature\Shared;

use App\Modules\Auth\Models\User;
use App\Modules\Listing\Models\Listing;
use App\Modules\Reference\Models\City;
use App\Modules\Reference\Models\School;
use App\Modules\Reference\Models\Ward;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ServiceAreaTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_and_direct_listing_access_exclude_outside_wards_without_deleting_data(): void
    {
        $local = Ward::factory()->create(['name' => 'Phường Sài Gòn']);
        $remoteCity = City::factory()->create(['name' => 'Hà Nội']);
        $remote = Ward::factory()->create(['name' => 'Phường Sài Gòn', 'city_id' => $remoteCity->id]);
        $outside = Ward::factory()->create(['name' => 'Phường Đông Hòa', 'city_id' => $local->city_id]);
        $localSchool = School::factory()->create(['city_id' => $local->city_id, 'ward_id' => null]);
        School::factory()->create(['city_id' => $remoteCity->id]);
        $room = Listing::factory()->create(['ward_id' => $local->id]);
        $oldRoom = Listing::factory()->create(['ward_id' => $remote->id]);
        $outsideRoom = Listing::factory()->create(['ward_id' => $outside->id]);

        $this->getJson('/api/cities')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'TP.HCM');
        $this->getJson('/api/wards')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $local->id);
        $this->getJson('/api/schools')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $localSchool->id);
        $this->getJson('/api/listings')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $room->id);
        $this->getJson('/api/listings?school_id='.$localSchool->id.'&sort=distance')->assertOk();
        foreach ([$oldRoom, $outsideRoom] as $excluded) {
            $this->getJson('/api/listings/'.$excluded->id)->assertNotFound();
            $this->getJson('/api/listings/'.$excluded->id.'/reviews')->assertNotFound();
            $this->assertDatabaseHas('listings', ['id' => $excluded->id]);
        }
        $this->getJson('/api/listings?ward_id='.$outside->id)->assertUnprocessable()->assertJsonValidationErrors('ward_id');
        $this->getJson('/api/listings?city_id='.$remoteCity->id)->assertUnprocessable()->assertJsonValidationErrors('city_id');
    }

    public function test_writes_favorites_and_ai_cannot_reintroduce_outside_listings(): void
    {
        $ward = Ward::factory()->create();
        $remoteCity = City::factory()->create(['name' => 'Đà Nẵng']);
        $remote = Ward::factory()->create(['city_id' => $remoteCity->id]);
        $landlord = User::factory()->landlord()->create();
        $room = Listing::factory()->create(['ward_id' => $ward->id, 'user_id' => $landlord->id]);
        $oldRoom = Listing::factory()->create(['ward_id' => $remote->id, 'user_id' => $landlord->id]);
        $student = User::factory()->create();
        $student->favorites()->attach($oldRoom->id);
        Http::fake();

        $this->actingAs($landlord, 'sanctum')->getJson('/api/my/listings')->assertOk()->assertJsonCount(1, 'data');
        $this->putJson('/api/listings/'.$room->id, ['ward_id' => $remote->id])
            ->assertUnprocessable()->assertJsonValidationErrors('ward_id');
        $this->postJson('/api/listings', [
            'title' => 'Phòng thử ngoài phạm vi', 'type' => 'room', 'price' => 2000000,
            'area_m2' => 20, 'address' => 'Số 1 đường A', 'latitude' => 10.7,
            'longitude' => 106.7, 'ward_id' => $remote->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('ward_id');
        $this->assertSame($ward->id, $room->refresh()->ward_id);

        $this->actingAs($student, 'sanctum')->getJson('/api/favorites')->assertOk()->assertJsonCount(0, 'data');
        $this->putJson('/api/favorites/'.$oldRoom->id)->assertNotFound();
        $this->postJson('/api/conversations', ['listing_id' => $oldRoom->id])->assertUnprocessable();
        $this->postJson('/api/ai/chat', ['message' => 'Phòng này thế nào?', 'listing_id' => $oldRoom->id])->assertUnprocessable();
        $this->postJson('/api/ai/price-advice', ['listing_id' => $oldRoom->id])->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_ai_budget_only_filters_wards_and_rejects_old_profile_school(): void
    {
        $ward = Ward::factory()->create();
        $city = City::factory()->create(['name' => 'Hà Nội']);
        $remote = Ward::factory()->create(['city_id' => $city->id]);
        foreach ([$ward, $remote] as $area) {
            Listing::factory()->create(['ward_id' => $area->id, 'price' => 2000000]);
        }
        $student = User::factory()->create(['budget_min' => 1000000, 'budget_max' => 3000000, 'school_id' => null]);
        Http::fake(['*/areas' => Http::response(['results' => [
            ['ward_id' => $ward->id, 'reason' => 'Phù hợp'],
            ['ward_id' => $remote->id, 'reason' => 'Ngoài phạm vi'],
        ]])]);
        $this->actingAs($student, 'sanctum')->postJson('/api/ai/area-suggestions')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.ward_id', $ward->id);
        Http::assertSent(fn ($request) => array_column($request->data()['areas'], 'ward_id') === [$ward->id]);

        $school = School::factory()->create(['city_id' => $city->id]);
        $student->update(['school_id' => $school->id]);
        $this->postJson('/api/ai/area-suggestions')->assertUnprocessable()->assertJsonValidationErrors('school_id');
        $this->putJson('/api/profile', ['school_id' => $school->id])->assertUnprocessable()->assertJsonValidationErrors('school_id');
    }
}
