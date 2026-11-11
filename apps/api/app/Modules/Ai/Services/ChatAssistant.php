<?php

namespace App\Modules\Ai\Services;

use App\Modules\Listing\Models\Listing;

class ChatAssistant
{
    public function __construct(private readonly AiClient $ai) {}

    /**
     * Chatbot proxy with optional listing context.
     *
     * @param  array<string, mixed>  $data  validated request data
     * @return array<string, mixed>
     */
    public function chat(array $data): array
    {
        $listingPayload = null;
        if (! empty($data['listing_id'])) {
            /** @var Listing|null $listing */
            $listing = Listing::query()
                ->visible()
                ->with(['amenities', 'ward'])
                ->find($data['listing_id']);

            if ($listing !== null) {
                $listingPayload = [
                    'title' => $listing->title,
                    'price' => (int) $listing->price,
                    'area_m2' => (float) $listing->area_m2,
                    'address' => $listing->address,
                    'ward' => $listing->ward?->name,
                    'amenities' => $listing->amenities->pluck('name')->values()->all(),
                    'description' => $listing->description,
                ];
            }
        }

        /** @var list<array{role: string, content: string}> $rawHistory */
        $rawHistory = is_array($data['history'] ?? null) ? array_values($data['history']) : [];

        $response = $this->ai->post('/chat', [
            'message' => $data['message'],
            'history' => array_map(
                /** @param array{role: string, content: string} $turn */
                fn (array $turn): array => ['role' => (string) $turn['role'], 'content' => (string) $turn['content']],
                array_slice($rawHistory, -10),
            ),
            'listing' => $listingPayload,
        ], ['reply']);

        return ['reply' => $response['reply']];
    }
}
