<?php

namespace App\Providers;

use App\Modules\Auth\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // PROMPTS.md step 10: surface N+1 queries as exceptions in dev/test.
        Model::preventLazyLoading(! app()->isProduction());

        // Sanctum stores the tokenable class name in
        // personal_access_tokens.tokenable_type. Rows issued before User moved
        // into the Auth module say "App\Models\User"; this alias keeps those
        // tokens valid (and keeps new rows in the same format).
        Relation::morphMap(['App\\Models\\User' => User::class]);

        // NOTE: production config guard lives in EnsureProductionConfig
        // MIDDLEWARE, not here. A boot-time throw breaks `composer install`
        // on any machine without a .env (CI): package:discover boots the app
        // and Laravel's config defaults resolve APP_ENV to "production".
        // Console context (composer scripts, artisan) must keep working;
        // HTTP requests are where a misconfigured prod must fail fast.
    }
}
