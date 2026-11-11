<?php

use App\Modules\Messaging\Http\Controllers\AttachmentController;
use Illuminate\Support\Facades\Route;

// Private chat attachments, opened straight in a browser tab via the
// temporary signed URL from MessageResource (60 minutes, no token).
Route::get('/attachments/{message}', [AttachmentController::class, 'show'])
    ->name('attachments.show')->middleware('signed:relative');
