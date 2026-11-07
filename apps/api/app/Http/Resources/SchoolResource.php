<?php

namespace App\Http\Resources;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * School object per API_CONTRACT §4:
 * { id, name, city, ward, latitude, longitude }.
 * city/ward are included when the relations were eager loaded; ward is
 * null for schools without a mapped ward (non-TP.HCM for now).
 *
 * @mixin School
 */
class SchoolResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'city' => $this->whenLoaded('city', fn () => $this->city === null ? null : [
                'id' => $this->city->id,
                'name' => $this->city->name,
                'type' => $this->city->type,
            ]),
            'ward' => $this->whenLoaded('ward', fn () => $this->ward === null ? null : [
                'id' => $this->ward->id,
                'name' => $this->ward->name,
            ]),
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
        ];
    }
}
