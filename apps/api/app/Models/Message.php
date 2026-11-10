<?php

namespace App\Models;

use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $conversation_id
 * @property int $sender_id
 * @property string $body
 * @property string|null $attachment_path
 * @property string|null $attachment_name
 * @property Carbon|null $read_at
 * @property Carbon|null $deleted_at
 * @property Carbon|null $seen_at
 * @property list<int>|null $deleted_for_user_ids
 * @property array<int|string, mixed>|null $reactions
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'attachment_path',
        'attachment_name',
        'read_at',
        'deleted_at',
        'deleted_for_user_ids',
        'seen_at',
        'reactions',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'deleted_at' => 'datetime',
            'seen_at' => 'datetime',
            'deleted_for_user_ids' => 'array',
            'reactions' => 'array',
        ];
    }

    /** Facebook "Thu hồi": đã unsend cho mọi người chưa. */
    public function isUnsent(): bool
    {
        return $this->deleted_at !== null;
    }

    /** Message này bị ẩn với user id $userId không (delete-for-me)? */
    public function isHiddenFor(int $userId): bool
    {
        return in_array($userId, $this->deleted_for_user_ids ?? [], true);
    }

    /** @return BelongsTo<Conversation, $this> */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /** @return BelongsTo<User, $this> */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
