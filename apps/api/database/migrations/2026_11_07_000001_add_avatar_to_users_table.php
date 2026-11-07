<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Key of one of the hand-drawn avatars (User::AVATARS). Nullable:
        // accounts made before avatars existed get a stable fallback derived
        // from their id (User::avatarKey()) until they pick one.
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar', 20)->nullable()->after('bio');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar');
        });
    }
};
