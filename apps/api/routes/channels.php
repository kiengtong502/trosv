<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
| Private channel authorization. Requests reach /broadcasting/auth with a
| Sanctum personal access token (Bearer) via the api middleware group
| (see bootstrap/app.php withBroadcasting).
*/

// One private channel per conversation: only the two participants may
// subscribe. Outsiders are rejected (false), never 404 - channel auth
// semantics differ from REST here.
Broadcast::channel('conversation.{conversationId}', function (User $user, int $conversationId) {
    $conversation = Conversation::find($conversationId);

    if (! $conversation) {
        return false;
    }

    return $conversation->student_id === $user->id
        || $conversation->landlord_id === $user->id;
});

// Per-user private channel: unread badge + conversation-list updates.
Broadcast::channel('App.Models.User.{id}', function (User $user, int $id) {
    return $user->id === $id;
});
