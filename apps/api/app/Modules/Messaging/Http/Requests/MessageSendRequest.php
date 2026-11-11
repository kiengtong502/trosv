<?php

namespace App\Modules\Messaging\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /api/conversations/{conversation}/messages - JSON { body } or
 * multipart (body + file). The multipart branch mirrors the previous
 * inline validation exactly (pdf/jpg/png/docx, max 5 MB).
 */
class MessageSendRequest extends FormRequest
{
    private const ATTACHMENT_MIMES = 'pdf,jpg,jpeg,png,docx';

    private const ATTACHMENT_MAX_KB = 5120;

    public function authorize(): bool
    {
        return true; // participant check runs in the controller (404 semantics)
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        // file() is non-null for a broken upload too (e.g. bigger than PHP's
        // upload_max_filesize) while hasFile() is false for it. Using hasFile()
        // here would validate it as a plain text message and crash later.
        return $this->file('file') !== null
            ? [
                'body' => ['nullable', 'string', 'max:1000'],
                'file' => ['required', 'file', 'mimes:'.self::ATTACHMENT_MIMES, 'max:'.self::ATTACHMENT_MAX_KB],
            ]
            : [
                'body' => ['required', 'string', 'max:1000'],
            ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'body.required' => 'Nội dung tin nhắn là bắt buộc.',
            'body.max' => 'Nội dung tin nhắn tối đa 1000 ký tự.',
            'file.required' => 'Tệp đính kèm là bắt buộc.',
            'file.mimes' => 'Tệp phải là pdf, jpg, png hoặc docx.',
            'file.max' => 'Tệp tối đa 5 MB.',
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'body' => 'Nội dung tin nhắn',
            'file' => 'Tệp đính kèm',
        ];
    }
}
