<?php

namespace App\Modules\Ai\Http\Controllers;

use App\Modules\Ai\Http\Requests\AiChatRequest;
use App\Modules\Ai\Http\Requests\AiDescriptionRequest;
use App\Modules\Ai\Http\Requests\AreaSuggestionsRequest;
use App\Modules\Ai\Http\Requests\PriceAdviceRequest;
use App\Modules\Ai\Http\Requests\RoommatesRequest;
use App\Modules\Ai\Services\AreaRecommender;
use App\Modules\Ai\Services\ChatAssistant;
use App\Modules\Ai\Services\DescriptionGenerator;
use App\Modules\Ai\Services\PriceAdvisor;
use App\Modules\Ai\Services\RoommateMatcher;
use App\Shared\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * AI proxy endpoints (API_CONTRACT §4 "AI", docs/contracts/AI_CONTRACT.md).
 * Thin HTTP layer: validation in FormRequests, data preparation and AI
 * calls in dedicated feature services. Backend prepares ALL data (the AI service
 * has no database) and never sends names, emails or phone numbers to it.
 */
class AiController extends Controller
{
    public function __construct(
        private readonly RoommateMatcher $roommates,
        private readonly PriceAdvisor $priceAdvice,
        private readonly AreaRecommender $areaSuggestions,
        private readonly ChatAssistant $chat,
        private readonly DescriptionGenerator $description,
    ) {}

    /**
     * POST /api/ai/roommates (Student). 422 when the profile is incomplete.
     */
    public function roommates(RoommatesRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->roommates->match($this->authUser($request))]);
    }

    /**
     * POST /api/ai/price-advice (Student). 422 when there are fewer than 3 comparables.
     */
    public function priceAdvice(PriceAdviceRequest $request): JsonResponse
    {
        $listingId = $request->validated('listing_id');
        $id = is_numeric($listingId) ? (int) $listingId : 0;

        return response()->json(['data' => $this->priceAdvice->advise($id)]);
    }

    /**
     * POST /api/ai/area-suggestions (Student). Budget/school fall back to the profile.
     */
    public function areaSuggestions(AreaSuggestionsRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->areaSuggestions->suggest($this->authUser($request), $request->validated())]);
    }

    /**
     * POST /api/ai/chat (any authenticated user). Optional listing context.
     */
    public function chat(AiChatRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->chat->chat($request->validated())]);
    }

    /**
     * POST /api/ai/description (Landlord). ids become names; missing title becomes "Nhà cho thuê".
     */
    public function description(AiDescriptionRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->description->generate($request->validated())]);
    }
}
