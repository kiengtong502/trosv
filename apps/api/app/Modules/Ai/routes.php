<?php

use App\Modules\Ai\Http\Controllers\AiController;
use Illuminate\Support\Facades\Route;

// AI proxy (API_CONTRACT §4 - "AI", docs/contracts/AI_CONTRACT.md).
// All endpoints: auth + 10 req/min per user; 503 when the AI service is down.
Route::middleware(['auth:sanctum', 'throttle.api:10,1'])->group(function () {
    Route::post('/ai/roommates', [AiController::class, 'roommates'])->middleware('role:student');
    Route::post('/ai/price-advice', [AiController::class, 'priceAdvice'])->middleware('role:student');
    Route::post('/ai/area-suggestions', [AiController::class, 'areaSuggestions'])->middleware('role:student');
    Route::post('/ai/chat', [AiController::class, 'chat']);
    Route::post('/ai/description', [AiController::class, 'description'])->middleware('role:landlord');
});
