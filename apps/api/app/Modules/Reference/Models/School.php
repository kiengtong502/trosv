<?php

namespace App\Modules\Reference\Models;

use App\Modules\Auth\Models\User;
use Database\Factories\SchoolFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $latitude
 * @property string $longitude
 * @property int|null $city_id
 * @property int|null $ward_id
 */
#[UseFactory(SchoolFactory::class)]
class School extends Model
{
    /** @use HasFactory<SchoolFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['name', 'city_id', 'ward_id', 'latitude', 'longitude'];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    /** @return HasMany<User, $this> */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Phuong/xa chua truong (nullable - chi TP.HCM dang gan day du).
     *
     * @return BelongsTo<Ward, $this>
     */
    public function ward(): BelongsTo
    {
        return $this->belongsTo(Ward::class);
    }
}
