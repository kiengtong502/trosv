<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvatarTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_assigns_a_random_valid_avatar(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Nguyễn Văn A',
            'email' => 'a@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'student',
        ])->assertCreated();

        $this->assertContains($response->json('data.user.avatar'), User::AVATARS);
        $this->assertDatabaseHas('users', [
            'email' => 'a@example.com',
            'avatar' => $response->json('data.user.avatar'),
        ]);
    }

    public function test_user_without_a_stored_avatar_gets_a_stable_fallback(): void
    {
        $user = User::factory()->create(['avatar' => null]);

        $first = $this->actingAs($user)->getJson('/api/me')->json('data.avatar');
        $second = $this->actingAs($user)->getJson('/api/me')->json('data.avatar');

        $this->assertContains($first, User::AVATARS);
        $this->assertSame($first, $second);
    }

    public function test_profile_update_changes_the_avatar(): void
    {
        $user = User::factory()->create(['avatar' => 'cat']);

        $this->actingAs($user)
            ->putJson('/api/profile', ['avatar' => 'robot'])
            ->assertOk()
            ->assertJsonPath('data.avatar', 'robot');

        $this->assertSame('robot', $user->fresh()->avatar);
    }

    public function test_profile_update_rejects_an_unknown_avatar(): void
    {
        $user = User::factory()->create(['avatar' => 'cat']);

        $this->actingAs($user)
            ->putJson('/api/profile', ['avatar' => 'dragon'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('avatar');
    }

    public function test_landlords_can_pick_an_avatar_too(): void
    {
        $landlord = User::factory()->landlord()->create(['avatar' => 'house']);

        $this->actingAs($landlord)
            ->putJson('/api/profile', ['avatar' => 'sun'])
            ->assertOk()
            ->assertJsonPath('data.avatar', 'sun');
    }

    public function test_avatar_is_exposed_wherever_a_person_is_shown(): void
    {
        $student = User::factory()->create(['avatar' => 'moon']);
        $landlord = User::factory()->landlord()->create(['avatar' => 'house']);

        $this->actingAs($landlord)
            ->getJson("/api/users/{$student->id}")
            ->assertOk()
            ->assertJsonPath('data.avatar', 'moon');
    }
}
