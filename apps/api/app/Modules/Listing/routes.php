<?php

use App\Modules\Listing\Http\Controllers\LandlordListingController;
use App\Modules\Listing\Http\Controllers\ListingController;
use App\Modules\Listing\Http\Controllers\ReviewController;
use Illuminate\Support\Facades\Route;

// Listing browse (API_CONTRACT §4 - "Duyệt tin đăng").
Route::get('/listings', [ListingController::class, 'index']);
Route::get('/listings/{listing}', [ListingController::class, 'show'])->whereNumber('listing');
Route::get('/listings/{listing}/reviews', [ReviewController::class, 'index'])->whereNumber('listing');

// Reviews (API_CONTRACT §4 - "Đánh giá", Student only).
Route::post('/listings/{listing}/reviews', [ReviewController::class, 'store'])
    ->middleware(['auth:sanctum', 'role:student'])
    ->whereNumber('listing');

// Landlord listing management (API_CONTRACT §4 - "Chủ nhà: quản lý tin đăng").
Route::middleware(['auth:sanctum', 'role:landlord'])->group(function () {
    Route::get('/my/listings', [LandlordListingController::class, 'index']);
    Route::post('/listings', [LandlordListingController::class, 'store']);
    Route::put('/listings/{listing}', [LandlordListingController::class, 'update'])->whereNumber('listing');
    Route::delete('/listings/{listing}', [LandlordListingController::class, 'destroy'])->whereNumber('listing');
    Route::post('/listings/{listing}/images', [LandlordListingController::class, 'uploadImages'])->whereNumber('listing');
    Route::delete('/listings/{listing}/images/{image}', [LandlordListingController::class, 'deleteImage'])
        ->whereNumber(['listing', 'image']);
});
