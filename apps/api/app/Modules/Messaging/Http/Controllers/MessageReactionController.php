<?php

namespace App\Modules\Messaging\Http\Controllers;

use App\Modules\Messaging\Events\MessageReacted;
use App\Modules\Messaging\Http\Requests\ReactionUpdateRequest;
use App\Modules\Messaging\Models\Message;
use App\Shared\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Messenger-style reactions: PUT để đặt/đổi emoji của mình trên một tin
 * (map { user_id: emoji }), DELETE để bỏ. Mỗi user MỘT reaction - gọi PUT
 * lần nữa với cùng emoji là bỏ. Khóa bản ghi khi đọc–sửa–ghi để giữ
 * reaction của người kia khi hai yêu cầu chạy đồng thời.
 */
class MessageReactionController extends Controller
{
    public function update(ReactionUpdateRequest $request, Message $message): JsonResponse
    {
        $this->authorizeParticipant($request, $message);

        $user = $this->authUser($request);

        $validated = $request->validated();

        $message = DB::transaction(function () use ($message, $user, $validated): Message {
            $fresh = Message::query()->lockForUpdate()->findOrFail($message->id);
            $reactions = $fresh->reactions ?? [];
            $mine = (string) $user->id;
            if (($reactions[$mine] ?? null) === $validated['emoji']) {
                unset($reactions[$mine]);
            } else {
                $reactions[$mine] = $validated['emoji'];
            }
            $fresh->reactions = $reactions;
            $fresh->save();

            return $fresh;
        });

        rescue(fn () => event(new MessageReacted($message, $user->id)), report: false);

        return response()->json(['data' => ['reactions' => $message->reactions ?? []]]);
    }

    public function destroy(Request $request, Message $message): JsonResponse
    {
        $this->authorizeParticipant($request, $message);

        $user = $this->authUser($request);

        $message = DB::transaction(function () use ($message, $user): Message {
            $fresh = Message::query()->lockForUpdate()->findOrFail($message->id);
            $reactions = $fresh->reactions ?? [];
            unset($reactions[(string) $user->id]);
            $fresh->reactions = $reactions;
            $fresh->save();

            return $fresh;
        });

        rescue(fn () => event(new MessageReacted($message, $user->id)), report: false);

        return response()->json(['data' => ['reactions' => $message->reactions ?? []]]);
    }
}
