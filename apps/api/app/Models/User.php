<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $password
 * @property string $role
 * @property string|null $phone
 * @property string|null $bio
 * @property int|null $school_id
 * @property int|null $budget_min
 * @property int|null $budget_max
 * @property string|null $sleep_schedule
 * @property int|null $cleanliness
 * @property bool|null $smoking
 * @property string|null $personality
 * @property string|null $interests
 * @property bool $looking_for_roommate
 * @property string|null $avatar
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** Keys of the hand-drawn avatars; the web app draws one SVG per key. */
    public const AVATARS = [
        'cat', 'plant', 'house', 'book', 'coffee', 'moon',
        'robot', 'cloud', 'sun', 'backpack', 'headphones', 'mushroom',
    ];

    // role values
    public const ROLE_STUDENT = 'student';

    public const ROLE_LANDLORD = 'landlord';

    // sleep_schedule values
    public const SLEEP_EARLY = 'early';

    public const SLEEP_NORMAL = 'normal';

    public const SLEEP_LATE = 'late';

    // personality values
    public const PERSONALITY_INTROVERT = 'introvert';

    public const PERSONALITY_AMBIVERT = 'ambivert';

    public const PERSONALITY_EXTROVERT = 'extrovert';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'bio',
        'avatar',
        'school_id',
        'budget_min',
        'budget_max',
        'sleep_schedule',
        'cleanliness',
        'smoking',
        'personality',
        'interests',
        'looking_for_roommate',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'smoking' => 'boolean',
            'looking_for_roommate' => 'boolean',
        ];
    }

    /** @return BelongsTo<School, $this> */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Listings posted by this user (landlord).
     *
     * @return HasMany<Listing, $this>
     */
    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class);
    }

    /**
     * Listings favorited by this user (pivot keeps saved-at timestamps).
     *
     * @return BelongsToMany<Listing, $this>
     */
    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(Listing::class, 'favorites')->withTimestamps()->withPivot('created_at');
    }

    /**
     * Conversations where this user is the student.
     *
     * @return HasMany<Conversation, $this>
     */
    public function studentConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'student_id');
    }

    /**
     * Conversations where this user is the landlord.
     *
     * @return HasMany<Conversation, $this>
     */
    public function landlordConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'landlord_id');
    }

    /**
     * Messages sent by this user.
     *
     * @return HasMany<Message, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Reviews written by this user (student).
     *
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'student_id');
    }

    /** The stored avatar, or a stable one derived from the id for older accounts. */
    public function avatarKey(): string
    {
        return in_array($this->avatar, self::AVATARS, true)
            ? $this->avatar
            : self::AVATARS[$this->id % count(self::AVATARS)];
    }
}
