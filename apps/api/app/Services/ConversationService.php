<?php

namespace App\Services;

use App\Events\MessageSeen;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Listing;
use App\Models\Message;
use App\Models\User;
use App\Support\StoragePath;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ConversationService
{
    /**
     * Get or create a 1-on-1 conversation between two users.
     *
     * @return array{0: Conversation, 1: bool}
     */
    public function findOrCreateConversation(int $userAId, int $userBId, ?int $listingId = null): array
    {
        $conversation = Conversation::where(function ($q) use ($userAId, $userBId) {
            $q->where('student_id', $userAId)->where('landlord_id', $userBId);
        })->orWhere(function ($q) use ($userAId, $userBId) {
            $q->where('student_id', $userBId)->where('landlord_id', $userAId);
        })->first();

        if (! $conversation) {
            $conversation = Conversation::create([
                'student_id' => $userAId,
                'landlord_id' => $userBId,
                'listing_id' => $listingId,
            ]);

            return [$conversation, true];
        }

        if ($listingId !== null && $conversation->listing_id !== $listingId) {
            $conversation->update(['listing_id' => $listingId]);
        }

        return [$conversation, false];
    }

    /**
     * Start a conversation about a listing between a student and a landlord.
     *
     * @return array{0: Conversation, 1: bool}
     */
    public function startListingConversation(User $student, Listing $listing): array
    {
        [$conversation, $wasCreated] = $this->findOrCreateConversation(
            $student->id,
            $listing->user_id,
            $listing->id
        );

        $this->sendRoomLinkIfNecessary($conversation, $student, $listing);

        return [$conversation, $wasCreated];
    }

    /**
     * Start a direct conversation between two users without a listing.
     *
     * @return array{0: Conversation, 1: bool}
     */
    public function startDirectConversation(User $student, User $targetUser): array
    {
        return $this->findOrCreateConversation($student->id, $targetUser->id, null);
    }

    /**
     * Get user conversations with unread counts and eager loaded relationships.
     *
     * @return Collection<int, Conversation>
     */
    public function getUserConversations(User $user): Collection
    {
        $studentQuery = $user->studentConversations()->select('id')->getQuery();
        $landlordQuery = $user->landlordConversations()->select('id')->getQuery();

        /** @var Collection<int, Conversation> */
        return Conversation::query()
            ->whereIn('id', $studentQuery->unionAll($landlordQuery))
            ->with(['listing.coverImage', 'student', 'landlord', 'lastMessage'])
            ->withCount(['messages as unread_count' => function ($q) use ($user): void {
                /** @var Builder<Message> $q */
                $q->where('sender_id', '!=', $user->id)
                    ->whereNull('read_at');
            }])
            ->orderByDesc('updated_at')
            ->get();
    }

    /**
     * Get messages for a conversation, filtering out messages deleted by the viewer.
     *
     * @return Collection<int, Message>
     */
    public function getConversationMessages(Conversation $conversation, User $viewer, ?int $afterId = null): Collection
    {
        $query = $conversation->messages()
            ->with('sender:id')
            ->where(fn ($q) => $q
                ->whereNull('deleted_for_user_ids')
                ->orWhereJsonDoesntContain('deleted_for_user_ids', $viewer->id))
            ->orderBy('id')
            ->limit(500);

        if ($afterId !== null) {
            $query->where('id', '>', $afterId);
        }

        /** @var Collection<int, Message> */
        return $query->get();
    }

    /**
     * Send automatic room post link to landlord if not recently sent within 15 minutes.
     */
    public function sendRoomLinkIfNecessary(Conversation $conversation, User $student, Listing $listing): void
    {
        $roomPath = "/rooms/{$listing->id}";
        $recentlySent = $conversation->messages()
            ->where('sender_id', $student->id)
            ->where('body', 'like', "%{$roomPath}%")
            ->where('created_at', '>=', now()->subMinutes(15))
            ->exists();

        if (! $recentlySent) {
            $msg1 = $conversation->messages()->create([
                'sender_id' => $student->id,
                'body' => 'Chào bạn, mình quan tâm đến phòng trọ này:',
            ]);
            $msg2 = $conversation->messages()->create([
                'sender_id' => $student->id,
                'body' => $roomPath,
            ]);
            $conversation->touch();
            rescue(fn () => broadcast(new MessageSent($msg1->load(['sender:id', 'conversation']))), report: false);
            rescue(fn () => broadcast(new MessageSent($msg2->load(['sender:id', 'conversation']))), report: false);
        }
    }

    /**
     * Send a message with optional file attachment.
     *
     * @param  array<string, mixed>  $data
     */
    public function sendMessage(
        Conversation $conversation,
        User $sender,
        array $data,
        ?UploadedFile $file = null
    ): Message {
        $attachmentPath = null;
        $attachmentName = null;

        if ($file !== null) {
            // Files are PRIVATE (local disk): served only through signed URLs.
            $rawName = $file->getClientOriginalName();
            // Sanitize against path traversal and HTTP header splitting (CRLF) in Content-Disposition
            $attachmentName = preg_replace('/[\r\n\x00-\x1F\x7F]/', '', basename($rawName)) ?: 'attachment';
            $attachmentPath = $file->store(StoragePath::attachment($conversation->id));
        }

        try {
            $message = $conversation->messages()->create([
                'sender_id' => $sender->id,
                'body' => $data['body'] ?? '',
                'attachment_path' => is_string($attachmentPath) ? $attachmentPath : null,
                'attachment_name' => $attachmentName,
            ]);
        } catch (Throwable $e) {
            // No orphaned upload on disk if the INSERT fails after the file
            // was already stored (MessageSent broadcasts outside the try,
            // exactly once, only after a committed row).
            if (is_string($attachmentPath)) {
                Storage::disk('local')->delete($attachmentPath);
            }

            throw $e;
        }

        // Touch so GET /conversations sorts by latest activity.
        $conversation->touch();

        // Realtime bubble delivery over Reverb (replaces 5s client polling).
        // Message shape mirrors MessageResource/contract §3 (body/reactions
        // match MessageResource exactly; seen_at starts null).
        rescue(fn () => broadcast(new MessageSent($message->load(['sender:id', 'conversation']))), report: false);

        return $message;
    }

    /**
     * Mark all unread messages from the other participant as read/seen.
     */
    public function markRead(Conversation $conversation, User $user): void
    {
        $now = now();

        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => $now,
                // Dấu đã xem: thời điểm NGƯỜI NHẬN mở thread.
                'seen_at' => $now,
            ]);

        // Sender hiển thị "Đã xem" ngay khi receiver mở thread.
        rescue(
            fn () => broadcast(new MessageSeen($conversation, $user, (string) $now->toISOString())),
            report: false
        );
    }
}
