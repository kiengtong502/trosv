<?php

use App\Modules\Messaging\Http\Controllers\ConversationController;
use App\Modules\Messaging\Http\Controllers\MessageDeletionController;
use App\Modules\Messaging\Http\Controllers\MessageReactionController;
use Illuminate\Support\Facades\Route;

// Messaging (API_CONTRACT §4 - "Nhắn tin"). Outsiders get 404.
Route::middleware(['auth:sanctum', 'role:student'])->group(function () {
    Route::post('/conversations', [ConversationController::class, 'store']);
    // Hội thoại trực tiếp giữa 2 sinh viên (không qua tin đăng) từ hồ sơ công khai.
    Route::post('/users/{user}/message', [ConversationController::class, 'storeDirect'])->whereNumber('user');
});
Route::get('/conversations', [ConversationController::class, 'index'])->middleware('auth:sanctum');
Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages'])
    ->middleware('auth:sanctum')->whereNumber('conversation');
Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage'])
    ->middleware(['auth:sanctum', 'throttle.api:30,1'])->whereNumber('conversation');
Route::post('/conversations/{conversation}/read', [ConversationController::class, 'markRead'])
    ->middleware('auth:sanctum')->whereNumber('conversation');

// Facebook-style deletion: sender "Thu hồi" (for everyone) or participant
// "Xóa chỉ ở phía mình". Outsiders get 404 like the rest of messaging.
Route::delete('/messages/{message}', [MessageDeletionController::class, 'destroy'])
    ->middleware('auth:sanctum')->whereNumber('message');

// Messenger-style reactions: PUT dat/doi (toggle cung emoji = bo), DELETE xoa.
Route::put('/messages/{message}/reactions', [MessageReactionController::class, 'update'])
    ->middleware('auth:sanctum')->whereNumber('message');
Route::delete('/messages/{message}/reactions', [MessageReactionController::class, 'destroy'])
    ->middleware('auth:sanctum')->whereNumber('message');
