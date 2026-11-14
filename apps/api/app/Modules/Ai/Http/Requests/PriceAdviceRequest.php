<?php

namespace App\Modules\Ai\Http\Requests;

use App\Shared\Support\ServiceArea;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /api/ai/price-advice. Messages/attributes copied from the previous
 * inline validation so the 422 JSON is unchanged (API_CONTRACT §1).
 */
class PriceAdviceRequest extends FormRequest
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
            'listing_id.required' => 'Tin đăng là bắt buộc.',
            'listing_id.exists' => 'Tin đăng không tồn tại.',
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
