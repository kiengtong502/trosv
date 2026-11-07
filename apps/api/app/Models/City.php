<?php

namespace App\Models;

use Database\Factories\CityFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Đơn vị hành chính cấp tỉnh (34 tỉnh/TP sau sắp xếp 2025).
 */
/**
 * @property int $id
 * @property string $name
 * @property string $type
 * @property string|null $latitude
 * @property string|null $longitude
 */
class City extends Model
{
    /** @use HasFactory<CityFactory> */
    use HasFactory;

    public const TYPE_CITY = 'city';       // thành phố trực thuộc TW

    public const TYPE_PROVINCE = 'province'; // tỉnh

    public $timestamps = false;

    protected $fillable = ['name', 'type', 'latitude', 'longitude'];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    /** @return HasMany<Ward, $this> */
    public function wards(): HasMany
    {
        return $this->hasMany(Ward::class);
    }

    /** @return HasMany<School, $this> */
    public function schools(): HasMany
    {
        return $this->hasMany(School::class);
    }
}
