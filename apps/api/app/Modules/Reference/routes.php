<?php

use App\Modules\Reference\Http\Controllers\ReferenceController;
use Illuminate\Support\Facades\Route;

// Reference data (API_CONTRACT §4 - "Dữ liệu tham chiếu").
// Cascade: chọn Tỉnh/TP trước (GET /cities), rồi lọc ward/trường theo city_id.
Route::get('/cities', [ReferenceController::class, 'cities']);
Route::get('/wards', [ReferenceController::class, 'wards']);
Route::get('/schools', [ReferenceController::class, 'schools']);
Route::get('/amenities', [ReferenceController::class, 'amenities']);
