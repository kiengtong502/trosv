<?php

namespace Tests\Feature\Auth;

use App\Modules\Auth\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Tokens issued before User moved into the Auth module carry
 * tokenable_type "App\Models\User" (see AppServiceProvider morph map).
 */
class TokenMorphTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_tokens_keep_legacy_tokenable_type(): void
    {
        $user = User::factory()->create();
        $user->createToken('t');

        $this->assertSame('App\\Models\\User', DB::table('personal_access_tokens')->value('tokenable_type'));
    }

    public function test_token_stored_with_legacy_type_still_authenticates(): void
    {
        $user = User::factory()->create();
        $plain = $user->createToken('t')->plainTextToken;
        DB::table('personal_access_tokens')->update(['tokenable_type' => 'App\\Models\\User']);

        $this->withToken($plain)->getJson('/api/me')->assertOk()->assertJsonPath('data.id', $user->id);
    }
}
