<?php

namespace App\Modules\Reference\Models;

use App\Modules\Listing\Models\Listing;
use Database\Factories\WardFactory;
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
 */
#[UseFactory(WardFactory::class)]
class Ward extends Model
{
    /** @use HasFactory<WardFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['name', 'city_id', 'latitude', 'longitude'];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    /** @return HasMany<Listing, $this> */
    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class);
    }

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
