<?php

namespace App\Modules\Auth\Http\Requests;

use App\Modules\Auth\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /api/register. Rules copied verbatim from the previous inline
 * validation so the 422 JSON is unchanged (API_CONTRACT §1).
 */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            // Emails are stored lowercase (ERD §3), so uniqueness is
            // effectively case-insensitive on PostgreSQL.
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_string($value) && User::where('email', strtolower($value))->exists()) {
                        $fail('Email đã được sử dụng.');
                    }
                },
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', Rule::in([User::ROLE_STUDENT, User::ROLE_LANDLORD])],
        ];
    }
}
