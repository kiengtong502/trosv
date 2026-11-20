<?php

use App\Modules\Auth\Http\Controllers\AuthController;
use App\Modules\Auth\Http\Controllers\ProfileController;
use App\Modules\Auth\Http\Controllers\UserPublicController;
use Illuminate\Support\Facades\Route;

$authThrottle = 'throttle.api:'.config()->integer('auth.throttle_per_minute', 10).',60';

// Authentication and profile (API_CONTRACT §4 - "Xác thực và hồ sơ").
Route::post('/register', [AuthController::class, 'register'])->middleware($authThrottle);
Route::post('/login', [AuthController::class, 'login'])->middleware($authThrottle);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::put('/profile', [ProfileController::class, 'update'])->middleware('auth:sanctum');

// Public student profiles (API_CONTRACT §4) - PII-safe, landlords 404.
Route::get('/users/{user}', [UserPublicController::class, 'show'])->whereNumber('user');
