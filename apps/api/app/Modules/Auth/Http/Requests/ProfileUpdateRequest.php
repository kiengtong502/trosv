<?php

namespace App\Modules\Auth\Http\Requests;

use App\Modules\Auth\Models\User;
use App\Shared\Support\ServiceArea;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * PUT /api/profile - partial update. Student-only fields are merged in for
 * students and silently dropped for landlords (API_CONTRACT §4). The
 * budget_max >= budget_min cross-field check stays in the controller
 * because it compares against persisted values.
 */
class ProfileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // auth:sanctum on the route
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $rules = [
            'name' => ['sometimes', 'string', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'avatar' => ['sometimes', 'string', Rule::in(User::AVATARS)],
        ];

        $user = $this->user();
        if ($user instanceof User && $user->role === User::ROLE_STUDENT) {
            $rules['school_id'] = ['sometimes', 'nullable', 'integer', Rule::exists('schools', 'id')->where(fn (Builder $query) => $query->whereIn('id', ServiceArea::schoolIds()))];
            $rules['budget_min'] = ['sometimes', 'nullable', 'integer', 'min:0', 'max:2100000000'];
            $rules['budget_max'] = ['sometimes', 'nullable', 'integer', 'min:0', 'max:2100000000'];
            $rules['sleep_schedule'] = ['sometimes', 'nullable', Rule::in([
                User::SLEEP_EARLY, User::SLEEP_NORMAL, User::SLEEP_LATE,
            ])];
            $rules['cleanliness'] = ['sometimes', 'nullable', 'integer', 'between:1,5'];
            $rules['smoking'] = ['sometimes', 'nullable', 'boolean'];
            $rules['personality'] = ['sometimes', 'nullable', Rule::in([
                User::PERSONALITY_INTROVERT, User::PERSONALITY_AMBIVERT, User::PERSONALITY_EXTROVERT,
            ])];
            $rules['interests'] = ['sometimes', 'nullable', 'string', 'max:255'];
            $rules['looking_for_roommate'] = ['sometimes', 'boolean'];
        }

        return $rules;
    }
}
