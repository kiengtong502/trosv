<?php

namespace App\Modules\Messaging\Http\Controllers;

use App\Modules\Auth\Models\User;
use App\Modules\Listing\Models\Listing;
use App\Modules\Messaging\Http\Requests\ConversationStoreRequest;
use App\Modules\Messaging\Http\Requests\DirectMessageRequest;
use App\Modules\Messaging\Http\Requests\MessageListRequest;
use App\Modules\Messaging\Http\Requests\MessageSendRequest;
use App\Modules\Messaging\Http\Resources\ConversationResource;
use App\Modules\Messaging\Http\Resources\MessageResource;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Services\ConversationService;
use App\Shared\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Messaging (API_CONTRACT §4 - "Nhắn tin"). One conversation per (student,
 * listing) pair. Outsiders receive 404, not 403. Conversations can also be
 * DIRECT (listing_id null) - started from a student's public profile.
 */
class ConversationController extends Controller
{
    public function __construct(
        protected ConversationService $conversationService
    ) {}

    /**
     * POST /api/conversations (Student) - get-or-create single conversation per person.
     * Forward to existing conversation with landlord and automatically send room post link.
     */
    public function store(ConversationStoreRequest $request): JsonResponse
    {
        $validated = $request->validated();

        /** @var User $student */
        $student = $this->authUser($request);
        /** @var Listing $listing */
        $listing = Listing::findOrFail($validated['listing_id']);

        // A student cannot start a conversation about their own listing
        if ($listing->user_id === $student->id) {
            throw new AuthorizationException;
        }

        [$conversation, $wasCreated] = $this->conversationService->startListingConversation($student, $listing);

        return $this->respondWithConversation($request, $conversation, $wasCreated);
    }

    /**
     * POST /api/users/{user}/message (Student) - get-or-create a DIRECT
     * conversation (listing_id null) with another student, from their
     * public profile. Targets that are landlords or yourself are 404.
     */
    public function storeDirect(DirectMessageRequest $request, User $user): JsonResponse
    {
        /** @var User $student */
        $student = $this->authUser($request);

        [$conversation, $wasCreated] = $this->conversationService->startDirectConversation(
            $student,
            $user
        );

        return $this->respondWithConversation($request, $conversation, $wasCreated);
    }

    /**
     * GET /api/conversations (User) - newest activity first, no pagination
     * (contract). unread_count counts messages from the OTHER user that are
     * not read yet. One query with correlated aggregates (no N+1).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->authUser($request);
        $conversations = $this->conversationService->getUserConversations($user);

        return response()->json([
            'data' => ConversationResource::collection($conversations)->resolve($request),
        ]);
    }

    /**
     * GET /api/conversations/{id}/messages (Participant) - oldest first,
     * `after_id` returns only newer messages for cheap polling.
     */
    public function messages(MessageListRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request, $conversation);

        $validated = $request->validated();
        $afterId = isset($validated['after_id']) && is_numeric($validated['after_id']) ? (int) $validated['after_id'] : null;

        /** @var User $user */
        $user = $this->authUser($request);
        $messages = $this->conversationService->getConversationMessages($conversation, $user, $afterId);

        return response()->json([
            'data' => MessageResource::collection($messages)->resolve($request),
        ]);
    }

    /**
     * POST /api/conversations/{id}/messages (Participant) - JSON { body } or
     * multipart (body + file: pdf/jpg/png/docx, max 5 MB).
     */
    public function sendMessage(MessageSendRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request, $conversation);

        $message = $this->conversationService->sendMessage(
            $conversation,
            $this->authUser($request),
            $request->validated(),
            $request->file('file')
        );

        return response()->json([
            'data' => (new MessageResource($message->load('sender:id')))->resolve($request),
        ], 201);
    }

    /**
     * POST /api/conversations/{id}/read (Participant) - mark the OTHER
     * user's messages as read, return null data.
     */
    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request, $conversation);

        $this->conversationService->markRead($conversation, $this->authUser($request));

        return response()->json(['data' => null]);
    }

    /**
     * Formats conversation with fresh relationships according to the API contract.
     */
    private function respondWithConversation(
        Request $request,
        Conversation $conversation,
        bool $wasCreated = false
    ): JsonResponse {
        return response()->json([
            'data' => (new ConversationResource(
                $conversation->fresh(['listing.coverImage', 'student', 'landlord', 'lastMessage'])
            ))->resolve($request),
        ], $wasCreated ? 201 : 200);
    }
}
