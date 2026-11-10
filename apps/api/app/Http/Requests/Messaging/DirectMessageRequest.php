<?php

namespace App\Http\Requests\Messaging;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * POST /api/users/{user}/message (student).
 * Targets that are landlords or yourself receive 404 per API_CONTRACT §4.
 */
class DirectMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        if (! $target instanceof User) {
            $userModel = User::find($target);
            $target = $userModel instanceof User ? $userModel : null;
        }

        if (! $target instanceof User) {
            return false;
        }

        return $target->role === User::ROLE_STUDENT && $target->id !== $this->user()?->id;
    }

    protected function failedAuthorization()
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Chỉ có thể nhắn tin cho sinh viên khác.',
        ], 404));
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [];
    }
}
