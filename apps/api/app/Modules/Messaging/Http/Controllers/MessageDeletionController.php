<?php

namespace App\Modules\Messaging\Http\Controllers;

use App\Modules\Messaging\Events\MessageDeleted;
use App\Modules\Messaging\Models\Message;
use App\Shared\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Facebook-style message deletion (API_CONTRACT §4 extension):
 *  - Sender, chưa hết 1 giờ: DELETE với scope=unsent - "Thu hồi" cho cả
 *    hai phía, body bị thay bằng tombstone "Tin nhắn đã được thu hồi".
 *  - Bất kỳ participant nào: scope=self - ẩn tin với chính mình, bên kia
 *    vẫn thấy bình thường.
 */
class MessageDeletionController extends Controller
{
    /** Cửa sổ thu hồi của Messenger: 1 giờ sau khi gửi. */
    private const UNSEND_WINDOW_MINUTES = 60;

    public function destroy(Request $request, Message $message): JsonResponse
    {
        $this->authorizeParticipant($request, $message);

        $user = $this->authUser($request);

        $scope = $request->string('scope', 'self')->toString();

        if ($scope === 'unsent') {
            if (! $user->can('unsend', $message)) {
                return response()->json([
                    'message' => 'Chỉ người gửi mới thu hồi được tin nhắn.',
                ], 403);
            }
            if ($message->isUnsent()) {
                return response()->json(['data' => null]); // idempotent
            }
            if ($message->created_at !== null && $message->created_at->lt(now()->subMinutes(self::UNSEND_WINDOW_MINUTES))) {
                return response()->json([
                    'message' => 'Đã quá thời gian cho phép thu hồi tin nhắn.',
                ], 422);
            }

            // Transaction + SELECT ... FOR UPDATE: two racing "unsend" calls
            // (retry, other tab) must not double-broadcast. The row is
            // re-read under lock inside the transaction and the window is
            // re-checked on the FRESH row, so the loser sees isUnsent() and
            // short-circuits idempotently.
            $attachmentPath = null;
            $unsent = DB::transaction(function () use ($message, &$attachmentPath): bool {
                /** @var Message|null $fresh */
                $fresh = Message::query()
                    ->whereKey($message->getKey())
                    ->lockForUpdate()
                    ->first();
                if ($fresh === null || $fresh->isUnsent()) {
                    return false;
                }
                $attachmentPath = $fresh->attachment_path;
                $fresh->deleted_at = now();
                $fresh->deleted_for_user_ids = null;
                $fresh->attachment_path = null;
                $fresh->save();

                return true;
            });

            if (! $unsent) {
                return response()->json(['data' => null]); // racing loser
            }

            // Unsent means gone for both sides: the file goes too (only after the row committed).
            if (is_string($attachmentPath)) {
                Storage::disk('local')->delete($attachmentPath);
            }

            rescue(fn () => event(new MessageDeleted($message, true, [])), report: false);

            return response()->json(['data' => null]);
        }

        // scope=self: hidden only for this viewer; idempotent per user.
        // Read-modify-write under a row lock: both participants hiding at
        // once must not overwrite each other's entry in the array.
        $hiddenNow = DB::transaction(function () use ($message, $user): bool {
            /** @var Message|null $fresh */
            $fresh = Message::query()
                ->whereKey($message->getKey())
                ->lockForUpdate()
                ->first();
            if ($fresh === null) {
                return false;
            }
            $hidden = $fresh->deleted_for_user_ids ?? [];
            if (in_array($user->id, $hidden, true)) {
                return false;
            }
            $hidden[] = $user->id;
            $fresh->deleted_for_user_ids = $hidden;
            $fresh->save();
            $message->deleted_for_user_ids = $hidden;

            return true;
        });

        if ($hiddenNow) {
            // Local effect only - other clients must not hide it, so the
            // payload marks the caller as the sole "deleted_for" recipient.
            rescue(fn () => event(new MessageDeleted($message, false, [$user->id])), report: false);
        }

        return response()->json(['data' => null]);
    }
}
