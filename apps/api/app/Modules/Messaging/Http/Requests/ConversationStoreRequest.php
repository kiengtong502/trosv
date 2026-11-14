<?php

namespace App\Modules\Messaging\Http\Requests;

use App\Shared\Support\ServiceArea;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /api/conversations (student). Rules copied verbatim from the
 * previous inline validation (API_CONTRACT §4).
 */
class ConversationStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // auth:sanctum + role:student on the route
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'listing_id' => ['required', 'integer', Rule::exists('listings', 'id')->where(fn (Builder $query) => $query->whereIn('ward_id', ServiceArea::wardIds()))],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'listing_id.required' => ':attribute là bắt buộc.',
            'listing_id.exists' => ':attribute không tồn tại.',
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'listing_id' => 'Tin đăng',
        ];
    }
}
