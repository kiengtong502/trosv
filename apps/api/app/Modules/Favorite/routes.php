<?php

use App\Modules\Favorite\Http\Controllers\FavoriteController;
use Illuminate\Support\Facades\Route;

// Favorites (API_CONTRACT §4 - "Yêu thích", Student only).
Route::middleware(['auth:sanctum', 'role:student'])->group(function () {
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::put('/favorites/{listing_id}', [FavoriteController::class, 'attach'])->whereNumber('listing_id');
    Route::delete('/favorites/{listing_id}', [FavoriteController::class, 'detach'])->whereNumber('listing_id');
});
